// KYC review adapter (GPS-M4 §2.2 — Tier A, PII). The human gate before money leaves.
// Rules: PII is decrypted SERVER-SIDE ONLY, masked by default; an explicit reveal is logged as
// KYC_VIEWED; every decision writes the Kyc status change + its audit row in ONE $transaction.
// Decrypt failures return a safe error — NEVER a partial-PII payload, NEVER PII in logs.
import { prisma } from "../prisma";
import { decryptPii, maskLast4 } from "../pii";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import {
  decideKycReview,
  type KycDecision,
} from "../../modules/admin/review";

export interface KycQueueRow {
  userId: string;
  phone: string | null;
  submittedAt: Date | null;
}

/** SUBMITTED KYC records, oldest first (the queue works from the top). No PII. */
export async function listKycQueue(): Promise<KycQueueRow[]> {
  const rows = await prisma.kyc.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { submittedAt: "asc" },
    select: {
      userId: true,
      submittedAt: true,
      user: { select: { phone: true } },
    },
  });
  return rows.map((r) => ({
    userId: r.userId,
    phone: r.user.phone,
    submittedAt: r.submittedAt,
  }));
}

export interface KycDecisionRecord {
  action: string;
  reason: string | null;
  at: Date;
  actorEmail: string | null;
}

export interface KycReviewDetail {
  userId: string;
  phone: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  panMasked: string | null;
  accountMasked: string | null;
  ifsc: string | null;
  holderName: string | null; // account-holder name is shown (not last-4 masked)
  submittedAt: Date | null;
  history: KycDecisionRecord[];
  decryptError: boolean; // true → PII could not be decrypted; render a safe error, hide fields
}

const KYC_AUDIT_ACTIONS = [
  "KYC_SUBMITTED",
  "KYC_VIEWED",
  "KYC_APPROVED",
  "KYC_REJECTED",
];

/** Masked review detail + decision history. PII masked by default (last-4). Decrypt errors are safe. */
export async function getKycReviewDetail(
  userId: string,
): Promise<KycReviewDetail | null> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: {
      userId: true,
      panEnc: true,
      accountNoEnc: true,
      accountHolderEnc: true,
      ifsc: true,
      status: true,
      submittedAt: true,
      user: { select: { phone: true } },
    },
  });
  if (!kyc) return null;

  const history = await prisma.adminAction.findMany({
    where: { entity: "Kyc", entityId: userId, action: { in: KYC_AUDIT_ACTIONS } },
    orderBy: { createdAt: "desc" },
    select: { action: true, meta: true, createdAt: true, actorEmail: true },
  });

  let panMasked: string | null = null;
  let accountMasked: string | null = null;
  let holderName: string | null = null;
  let decryptError = false;
  try {
    panMasked = kyc.panEnc ? maskLast4(decryptPii(kyc.panEnc)) : null;
    accountMasked = kyc.accountNoEnc
      ? maskLast4(decryptPii(kyc.accountNoEnc))
      : null;
    holderName = kyc.accountHolderEnc
      ? decryptPii(kyc.accountHolderEnc)
      : null;
  } catch {
    // Never surface partial PII or the underlying error (which could echo ciphertext).
    decryptError = true;
    panMasked = accountMasked = holderName = null;
  }

  return {
    userId: kyc.userId,
    phone: kyc.user.phone,
    status: kyc.status,
    panMasked,
    accountMasked,
    ifsc: kyc.ifsc,
    holderName,
    submittedAt: kyc.submittedAt,
    decryptError,
    history: history.map((h) => ({
      action: h.action,
      reason: (h.meta as { reason?: string } | null)?.reason ?? null,
      at: h.createdAt,
      actorEmail: h.actorEmail,
    })),
  };
}

export interface RevealedKyc {
  pan: string;
  accountNumber: string;
  holderName: string;
  ifsc: string | null;
}

/**
 * Full-PII reveal for a reviewer, logged as KYC_VIEWED (§1D). Decrypts server-side; the audit row
 * carries NO PII. Throws a generic error on decrypt failure (safe — never partial PII).
 */
export async function revealKyc(
  actor: AdminIdentity,
  userId: string,
): Promise<RevealedKyc> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: {
      panEnc: true,
      accountNoEnc: true,
      accountHolderEnc: true,
      ifsc: true,
    },
  });
  if (!kyc || !kyc.panEnc || !kyc.accountNoEnc)
    throw new Error("KYC record not found");

  let revealed: RevealedKyc;
  try {
    revealed = {
      pan: decryptPii(kyc.panEnc),
      accountNumber: decryptPii(kyc.accountNoEnc),
      holderName: kyc.accountHolderEnc ? decryptPii(kyc.accountHolderEnc) : "",
      ifsc: kyc.ifsc,
    };
  } catch {
    throw new Error("Could not decrypt KYC details");
  }

  // Log the reveal AFTER a successful decrypt; audit row carries no PII.
  await prisma.$transaction((tx) =>
    recordAdminAction(tx, {
      actor,
      action: "KYC_VIEWED",
      entity: "Kyc",
      entityId: userId,
    }),
  );
  return revealed;
}

export type KycReviewOutcome =
  | { ok: true; status: "APPROVED" | "REJECTED" }
  | { ok: false; error: string };

/**
 * Approve/reject a submitted KYC record. Domain rule decides legality; the status change and its
 * audit row (KYC_APPROVED / KYC_REJECTED with reason) commit in ONE $transaction.
 */
export async function reviewKyc(
  actor: AdminIdentity,
  userId: string,
  decision: KycDecision,
  reason?: string,
): Promise<KycReviewOutcome> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: { status: true },
  });
  if (!kyc) return { ok: false, error: "KYC record not found" };

  const verdict = decideKycReview(kyc.status, decision, reason);
  if (!verdict.ok) return { ok: false, error: verdict.message };

  await prisma.$transaction(async (tx) => {
    await tx.kyc.update({
      where: { userId },
      data: { status: verdict.nextStatus },
    });
    await recordAdminAction(tx, {
      actor,
      action: verdict.nextStatus === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
      entity: "Kyc",
      entityId: userId,
      meta: reason?.trim() ? { reason: reason.trim() } : undefined,
    });
  });
  return { ok: true, status: verdict.nextStatus };
}
