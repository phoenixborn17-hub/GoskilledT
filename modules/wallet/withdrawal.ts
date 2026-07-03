// Withdrawal rules — ported from legacy spec (vNext ADR §2) + DR-025 + D-01 gate.
// ₹500–₹25,000 · KYC approved · single pending · available (not held) balance only.

export const MIN_WITHDRAWAL_PAISE = 50_000;     // ₹500
export const MAX_WITHDRAWAL_PAISE = 2_500_000;  // ₹25,000

export interface WithdrawalContext {
  payoutsEnabled: boolean;            // AFFILIATE_PAYOUTS_ENABLED flag — OFF until D-01
  kycStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  hasPendingWithdrawal: boolean;      // any APPLIED / IN_PROGRESS
  availableInPaise: number;           // availableBalanceOf() — NEVER total/held
  amountInPaise: number;
}

export type WithdrawalCheck = { ok: true } | { ok: false; code: string; message: string };

export function validateWithdrawal(c: WithdrawalContext): WithdrawalCheck {
  if (!c.payoutsEnabled) return { ok: false, code: "PAYOUTS_DISABLED", message: "Payouts activate after review (D-01)." };
  if (c.kycStatus !== "APPROVED") return { ok: false, code: "KYC_REQUIRED", message: "Complete KYC verification first." };
  if (c.hasPendingWithdrawal) return { ok: false, code: "PENDING_EXISTS", message: "You already have a withdrawal in progress." };
  if (!Number.isInteger(c.amountInPaise) || c.amountInPaise <= 0) return { ok: false, code: "INVALID_AMOUNT", message: "Invalid amount." };
  if (c.amountInPaise < MIN_WITHDRAWAL_PAISE) return { ok: false, code: "BELOW_MIN", message: "Minimum withdrawal is ₹500." };
  if (c.amountInPaise > MAX_WITHDRAWAL_PAISE) return { ok: false, code: "ABOVE_MAX", message: "Maximum withdrawal is ₹25,000." };
  if (c.amountInPaise > c.availableInPaise) return { ok: false, code: "INSUFFICIENT", message: "Amount exceeds your available (unlocked) balance." };
  return { ok: true };
}

/** Payout execution TxSpec: wallet debit ↔ payout clearing. Built only after validateWithdrawal passes + admin approves. */
export function payoutIdempotencyKey(withdrawalId: string): string {
  return `payout:${withdrawalId}`;
}
