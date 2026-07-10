// Display formatting for GoSkilled — Indian-locale grouping + the money-never-fail-to-zero
// contract (Frozen_Spec_Amendments §B). Money is stored in PAISE and all money MATH lives in
// `lib/money.ts`; this module ONLY formats already-computed values for display. It never
// re-derives, rounds-for-storage, or mutates money.

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat("en-IN"); // 1,50,000 (lakh/crore grouping)

export interface MoneyFormatOptions {
  /** Show 2-decimal paise precision. Default false → whole-rupee (wallet/earn display). */
  paise?: boolean;
}

/** Format a PAISE amount as ₹ with Indian digit grouping. Display only. */
export function formatINRFromPaise(
  paise: number,
  opts: MoneyFormatOptions = {},
): string {
  const rupees = paise / 100;
  return opts.paise
    ? inrPaise.format(rupees)
    : inrWhole.format(Math.round(rupees));
}

/** Indian digit grouping for plain counts (referrals, learners, streaks): 1,50,000. */
export function formatCount(n: number): string {
  return count.format(n);
}

export type SafeDisplay = { ok: true; text: string } | { ok: false };

/**
 * money-never-fail-to-zero (Amendments §B — the trust lock). A currency value renders ONLY from
 * real, finite data. Missing / non-finite input → `{ ok: false }` so the UI shows
 * "Couldn't load — Retry", **never ₹0, never blank**. Applies to wallet / earned / held /
 * balances / commissions. Note: a genuine, loaded ₹0 (e.g. a real zero balance) is a valid value
 * and returns `{ ok: true }` — only *absent/broken* data fails safe.
 */
export function safeMoney(
  paise: number | null | undefined,
  opts?: MoneyFormatOptions,
): SafeDisplay {
  if (paise == null || typeof paise !== "number" || !Number.isFinite(paise)) {
    return { ok: false };
  }
  return { ok: true, text: formatINRFromPaise(paise, opts) };
}

/** Same fail-safe contract for referral counts / numeric stats (never a fabricated 0 on failure). */
export function safeCount(n: number | null | undefined): SafeDisplay {
  if (n == null || typeof n !== "number" || !Number.isFinite(n)) {
    return { ok: false };
  }
  return { ok: true, text: formatCount(n) };
}
