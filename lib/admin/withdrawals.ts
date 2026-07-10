// Withdrawals review + payout marking (GPS-M4 §2.3 — Tier A, the most sensitive surface).
// Tuesday payout run: verify → pay via bank (manual rail) → Mark PAID. Marking NEVER hand-writes
// money: it recomputes the AVAILABLE balance from the ledger at marking time, then executes the
// domain PAYOUT TxSpec (idempotent) + flips the row + audits — all in ONE $transaction.
import { prisma } from "../prisma";
import { decryptPii, maskLast4 } from "../pii";
import { payoutsEnabled } from "../env";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import { availableBalanceOf } from "../../modules/ledger/ledger";
import { executeTxSpec } from "../../modules/ledger/persist";
import {
  buildPayoutTxSpec,
  canMarkWithdrawalPaid,
  canMarkWithdrawalInProgress,
} from "../../modules/wallet/withdrawal";

export interface WithdrawalRow {
  id: string;
  userId: string;
  phone: string | null;
  amountInPaise: number;
  status: "APPLIED" | "IN_PROGRESS" | "PAID" | "REJECTED";
  kycStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null;
  accountLast4: string | null;
  holderName: string | null;
  availableInPaise: number | null; // current AVAILABLE balance (queue only; null in history)
  requestedAt: Date;
  paidAt: Date | null;
  adminNote: string | null;
}

async function shapeRows(
  rows: {
    id: string;
    userId: string;
    amountInPaise: number;
    status: string;
    requestedAt: Date;
    paidAt: Date | null;
    adminNote: string | null;
    user: {
      phone: string | null;
      kyc: {
        status: string;
        accountNoEnc: string | null;
        accountHolderEnc: string | null;
      } | null;
    };
  }[],
  availByUser?: Map<string, number>,
): Promise<WithdrawalRow[]> {
  return rows.map((w) => {
    const kyc = w.user.kyc;
    let accountLast4: string | null = null;
    let holderName: string | null = null;
    try {
      accountLast4 = kyc?.accountNoEnc
        ? maskLast4(decryptPii(kyc.accountNoEnc))
        : null;
      holderName = kyc?.accountHolderEnc
        ? decryptPii(kyc.accountHolderEnc)
        : null;
    } catch {
      accountLast4 = holderName = null; // never surface partial PII
    }
    return {
      id: w.id,
      userId: w.userId,
      phone: w.user.phone,
      amountInPaise: w.amountInPaise,
      status: w.status as WithdrawalRow["status"],
      kycStatus: (kyc?.status as WithdrawalRow["kycStatus"]) ?? null,
      accountLast4,
      holderName,
      availableInPaise: availByUser?.get(w.userId) ?? null,
      requestedAt: w.requestedAt,
      paidAt: w.paidAt,
      adminNote: w.adminNote,
    };
  });
}

const rowSelect = {
  id: true,
  userId: true,
  amountInPaise: true,
  status: true,
  requestedAt: true,
  paidAt: true,
  adminNote: true,
  user: {
    select: {
      phone: true,
      kyc: {
        select: { status: true, accountNoEnc: true, accountHolderEnc: true },
      },
    },
  },
} as const;

/** The open payout queue: APPLIED / IN_PROGRESS, oldest first, with each affiliate's live AVAILABLE
 * balance (for the verify checklist — the real gate is still server-recomputed at marking time). */
export async function listWithdrawalQueue(): Promise<WithdrawalRow[]> {
  const rows = await prisma.withdrawal.findMany({
    where: { status: { in: ["APPLIED", "IN_PROGRESS"] } },
    orderBy: { requestedAt: "asc" },
    select: rowSelect,
  });
  const userIds = [...new Set(rows.map((r) => r.userId))];
  const accounts = userIds.length
    ? await prisma.ledgerAccount.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          entries: { select: { amountInPaise: true, holdUntil: true } },
        },
      })
    : [];
  const availByUser = new Map(
    accounts.map((a) => [a.userId!, availableBalanceOf(a.entries)]),
  );
  return shapeRows(rows, availByUser);
}

/** Completed history: PAID / REJECTED, newest first. */
export async function listWithdrawalHistory(): Promise<WithdrawalRow[]> {
  const rows = await prisma.withdrawal.findMany({
    where: { status: { in: ["PAID", "REJECTED"] } },
    orderBy: { requestedAt: "desc" },
    take: 100,
    select: rowSelect,
  });
  return shapeRows(rows);
}

export type MarkPaidResult =
  | { ok: true; ledgerTxId: string | null; idempotent: boolean }
  | { ok: false; error: string };

/**
 * Mark a withdrawal PAID after the real bank transfer. In ONE $transaction: reload the row,
 * recompute the AVAILABLE balance from the ledger (never trust the queue), re-check KYC + amount,
 * execute the domain PAYOUT TxSpec (idempotent via payoutIdempotencyKey), flip status=PAID + paidAt,
 * and audit WITHDRAWAL_PAID with the ledger tx id. A double-mark is an idempotent no-op.
 */
export async function markWithdrawalPaid(
  actor: AdminIdentity,
  withdrawalId: string,
): Promise<MarkPaidResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        select: { id: true, userId: true, amountInPaise: true, status: true },
      });
      if (!w) return { ok: false as const, error: "Withdrawal not found." };

      const [kyc, account] = await Promise.all([
        tx.kyc.findUnique({
          where: { userId: w.userId },
          select: { status: true },
        }),
        tx.ledgerAccount.findUnique({
          where: { userId: w.userId },
          select: {
            entries: { select: { amountInPaise: true, holdUntil: true } },
          },
        }),
      ]);
      const available = availableBalanceOf(account?.entries ?? []);

      const gate = canMarkWithdrawalPaid({
        payoutsEnabled: payoutsEnabled(), // D-01: no payout executes while OFF
        status: w.status as WithdrawalRow["status"],
        kycApproved: kyc?.status === "APPROVED",
        availableInPaise: available,
        amountInPaise: w.amountInPaise,
      });
      if (!gate.ok) return { ok: false as const, error: gate.message };

      // Domain-built, zero-sum PAYOUT legs. Idempotent: a replay returns skipped=true.
      const spec = buildPayoutTxSpec({
        withdrawalId: w.id,
        userId: w.userId,
        amountInPaise: w.amountInPaise,
      });
      const exec = await executeTxSpec(tx, spec);

      await tx.withdrawal.update({
        where: { id: w.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await recordAdminAction(tx, {
        actor,
        action: "WITHDRAWAL_PAID",
        entity: "Withdrawal",
        entityId: w.id,
        meta: {
          amountInPaise: w.amountInPaise,
          ledgerTxId: exec.transactionId ?? null,
          idempotent: exec.skipped,
        },
      });
      return {
        ok: true as const,
        ledgerTxId: exec.transactionId ?? null,
        idempotent: exec.skipped,
      };
    });
  } catch {
    return { ok: false, error: "Could not mark paid. Please retry." };
  }
}

export type InProgressResult = { ok: true } | { ok: false; error: string };

/**
 * Move an APPLIED withdrawal to IN_PROGRESS (payout run started — no money moves yet). Status +
 * audit (WITHDRAWAL_IN_PROGRESS) commit in ONE $transaction. The PAYOUT ledger tx fires only later
 * at Mark PAID (and only when payoutsEnabled).
 */
export async function markWithdrawalInProgress(
  actor: AdminIdentity,
  withdrawalId: string,
): Promise<InProgressResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        select: { status: true },
      });
      if (!w) return { ok: false as const, error: "Withdrawal not found." };

      const gate = canMarkWithdrawalInProgress({
        status: w.status as WithdrawalRow["status"],
      });
      if (!gate.ok) return { ok: false as const, error: gate.message };

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "IN_PROGRESS" },
      });
      await recordAdminAction(tx, {
        actor,
        action: "WITHDRAWAL_IN_PROGRESS",
        entity: "Withdrawal",
        entityId: withdrawalId,
      });
      return { ok: true as const };
    });
  } catch {
    return { ok: false, error: "Could not update. Please retry." };
  }
}

export type RejectResult = { ok: true } | { ok: false; error: string };

/**
 * Reject an open withdrawal (reason required). Funds remain AVAILABLE — no ledger move. Status +
 * audit (WITHDRAWAL_REJECTED with reason) commit in ONE $transaction.
 */
export async function rejectWithdrawal(
  actor: AdminIdentity,
  withdrawalId: string,
  reason: string,
): Promise<RejectResult> {
  if (!reason.trim()) return { ok: false, error: "A reason is required." };
  try {
    return await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        select: { status: true },
      });
      if (!w) return { ok: false as const, error: "Withdrawal not found." };
      if (w.status === "PAID")
        return { ok: false as const, error: "Already paid — cannot reject." };
      if (w.status === "REJECTED")
        return { ok: false as const, error: "Already rejected." };

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "REJECTED", adminNote: reason.trim() },
      });
      await recordAdminAction(tx, {
        actor,
        action: "WITHDRAWAL_REJECTED",
        entity: "Withdrawal",
        entityId: withdrawalId,
        meta: { reason: reason.trim() },
      });
      return { ok: true as const };
    });
  } catch {
    return { ok: false, error: "Could not reject. Please retry." };
  }
}
