// 3-level affiliate commission — DR-007. Amounts in PAISE.
// L1 = direct referrer, L2 = their referrer, L3 = next up.

export type PackageSlug = "skill-builder" | "career-booster";
export type Level = 1 | 2 | 3;

// [L1, L2, L3] in paise. DR-007: SB ₹900/150/75, CB ₹1250/250/150.
export const COMMISSION_TABLE: Record<PackageSlug, [number, number, number]> = {
  "skill-builder": [90000, 15000, 7500],
  "career-booster": [125000, 25000, 15000],
};

export function commissionForLevel(pkg: PackageSlug, level: Level): number {
  return COMMISSION_TABLE[pkg][level - 1];
}

export function totalCommission(pkg: PackageSlug): number {
  return COMMISSION_TABLE[pkg].reduce((a, b) => a + b, 0);
}

/** Idempotency key for a single commission credit — prevents double-credit on webhook retry. */
export function commissionIdempotencyKey(orderId: string, uplineUserId: string, level: Level): string {
  return `commission:${orderId}:${uplineUserId}:${level}`;
}

// ─────────────── DR-025: refund window + commission hold ───────────────

/** 48-hour no-questions refund window. Commissions are HELD until it closes. */
export const REFUND_WINDOW_HOURS = 48;

/** When a commission credited for a payment at `paidAt` becomes AVAILABLE. */
export function commissionHoldUntil(paidAt: Date): Date {
  return new Date(paidAt.getTime() + REFUND_WINDOW_HOURS * 60 * 60 * 1000);
}

/** Whether an order paid at `paidAt` is still inside the self-serve refund window. */
export function isWithinRefundWindow(paidAt: Date, now: Date = new Date()): boolean {
  return now < commissionHoldUntil(paidAt);
}

/**
 * Idempotency key for a clawback (within-window refund reversal).
 * Post-window refunds are MANUAL: a negative ADJUSTMENT entry that nets against
 * future earnings — never reclaim money already paid out to a bank (DR-025).
 */
export function clawbackIdempotencyKey(orderId: string, uplineUserId: string, level: Level): string {
  return `clawback:${orderId}:${uplineUserId}:${level}`;
}
