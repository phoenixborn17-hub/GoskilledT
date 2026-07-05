// §2.6 referral milestones — PURE domain (no React, no DB). Derived entirely from the real invite
// count. D-29: tiers are COUNT thresholds only; any celebration copy is community/count framed, never
// earnings. Kept pure so the tier boundaries are unit-tested independently of the UI (M1 pattern).
export const REFERRAL_TIERS = [1, 5, 10, 25] as const;

/** Highest tier the count has reached (0 if none reached yet). */
export function highestReachedTier(count: number): number {
  let t = 0;
  for (const tier of REFERRAL_TIERS) if (count >= tier) t = tier;
  return t;
}

/** The next tier above the count, or null once every tier is reached. */
export function nextTier(count: number): number | null {
  return REFERRAL_TIERS.find((t) => t > count) ?? null;
}
