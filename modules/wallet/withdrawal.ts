// Withdrawal rules — ported from legacy spec (vNext ADR §2) + DR-025 + D-01 gate.
// ₹500–₹25,000 · KYC approved · single pending · available (not held) balance only.
import type { TxSpec, LedgerLeg } from "../ledger/ledger";

export const MIN_WITHDRAWAL_PAISE = 50_000; // ₹500
export const MAX_WITHDRAWAL_PAISE = 2_500_000; // ₹25,000

export interface WithdrawalContext {
  payoutsEnabled: boolean; // AFFILIATE_PAYOUTS_ENABLED flag — OFF until D-01
  kycStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  hasPendingWithdrawal: boolean; // any APPLIED / IN_PROGRESS
  availableInPaise: number; // availableBalanceOf() — NEVER total/held
  amountInPaise: number;
}

export type WithdrawalCheck =
  { ok: true } | { ok: false; code: string; message: string };

export function validateWithdrawal(c: WithdrawalContext): WithdrawalCheck {
  if (!c.payoutsEnabled)
    return {
      ok: false,
      code: "PAYOUTS_DISABLED",
      message: "Payouts activate after review (D-01).",
    };
  if (c.kycStatus !== "APPROVED")
    return {
      ok: false,
      code: "KYC_REQUIRED",
      message: "Complete KYC verification first.",
    };
  if (c.hasPendingWithdrawal)
    return {
      ok: false,
      code: "PENDING_EXISTS",
      message: "You already have a withdrawal in progress.",
    };
  if (!Number.isInteger(c.amountInPaise) || c.amountInPaise <= 0)
    return { ok: false, code: "INVALID_AMOUNT", message: "Invalid amount." };
  if (c.amountInPaise < MIN_WITHDRAWAL_PAISE)
    return {
      ok: false,
      code: "BELOW_MIN",
      message: "Minimum withdrawal is ₹500.",
    };
  if (c.amountInPaise > MAX_WITHDRAWAL_PAISE)
    return {
      ok: false,
      code: "ABOVE_MAX",
      message: "Maximum withdrawal is ₹25,000.",
    };
  if (c.amountInPaise > c.availableInPaise)
    return {
      ok: false,
      code: "INSUFFICIENT",
      message: "Amount exceeds your available (unlocked) balance.",
    };
  return { ok: true };
}

/** Payout execution TxSpec: wallet debit ↔ payout clearing. Built only after validateWithdrawal passes + admin approves. */
export function payoutIdempotencyKey(withdrawalId: string): string {
  return `payout:${withdrawalId}`;
}

// ── Admin payout marking (GPS-M4 §2.3) — domain rules; the admin adapter NEVER hand-writes legs. ──

export type PayoutMarkDecision =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * Server-recomputed gate for "Mark PAID" (GPS-M4 §2.3). Never trusts the queue row: the admin
 * adapter reloads the withdrawal + recomputes the AVAILABLE balance from the ledger at marking
 * time and passes them here. Non-APPLIED status → not markable (double-mark caught separately by
 * ledger idempotency). Balance moved below the amount since APPLIED → hard stop.
 */
export function canMarkWithdrawalPaid(c: {
  status: "APPLIED" | "IN_PROGRESS" | "PAID" | "REJECTED";
  kycApproved: boolean;
  availableInPaise: number;
  amountInPaise: number;
}): PayoutMarkDecision {
  if (c.status === "PAID")
    return { ok: false, code: "ALREADY_PAID", message: "Already marked paid." };
  if (c.status === "REJECTED")
    return {
      ok: false,
      code: "REJECTED",
      message: "This withdrawal was rejected.",
    };
  if (!c.kycApproved)
    return {
      ok: false,
      code: "KYC_NOT_APPROVED",
      message: "KYC is not approved — cannot pay out.",
    };
  if (c.amountInPaise > c.availableInPaise)
    return {
      ok: false,
      code: "BALANCE_CHANGED",
      message:
        "Available balance is now below the requested amount — re-review before paying.",
    };
  return { ok: true };
}

/**
 * The zero-sum PAYOUT ledger transaction for a marked withdrawal: debit the affiliate's wallet,
 * credit the payout-clearing account. holdUntil is null (a payout is immediate, never held).
 * Idempotency key makes a double-mark a no-op at the ledger layer.
 */
export function buildPayoutTxSpec(input: {
  withdrawalId: string;
  userId: string;
  amountInPaise: number;
}): TxSpec {
  const legs: LedgerLeg[] = [
    {
      account: { kind: "USER_WALLET", userId: input.userId },
      amountInPaise: -input.amountInPaise,
    },
    { account: { kind: "PAYOUT_CLEARING" }, amountInPaise: input.amountInPaise },
  ];
  return {
    type: "PAYOUT",
    idempotencyKey: payoutIdempotencyKey(input.withdrawalId),
    refType: "Withdrawal",
    refId: input.withdrawalId,
    legs,
  };
}
