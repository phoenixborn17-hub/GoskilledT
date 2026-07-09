// Contribution tiers — PURE domain (Phase D · DR-035). Tiers reflect learning contribution
// (referred learners who completed a course), NEVER earnings or team size. Thresholds are
// configurable (LAUNCH_CONFIG — flagged); progress is derived from canon, never stored/fabricated.

export type Tier = "Contributor" | "Mentor" | "Community Champion";

export interface TierThresholds {
  mentor: number; // completed-referrals to reach Mentor
  champion: number; // completed-referrals to reach Community Champion
}

// Safe defaults — FLAGGED for the founder (LAUNCH_CONFIG). Learning-first framing (DR-035).
export const DEFAULT_TIER_THRESHOLDS: TierThresholds = {
  mentor: 5,
  champion: 15,
};

/** Read thresholds from env (TIER_MENTOR_AT / TIER_CHAMPION_AT), falling back to safe defaults. */
export function tierThresholds(): TierThresholds {
  const mentor = Number(process.env.TIER_MENTOR_AT);
  const champion = Number(process.env.TIER_CHAMPION_AT);
  return {
    mentor:
      Number.isInteger(mentor) && mentor > 0
        ? mentor
        : DEFAULT_TIER_THRESHOLDS.mentor,
    champion:
      Number.isInteger(champion) && champion > 0
        ? champion
        : DEFAULT_TIER_THRESHOLDS.champion,
  };
}

export function computeTier(
  completedReferrals: number,
  t: TierThresholds = tierThresholds(),
): Tier {
  if (completedReferrals >= t.champion) return "Community Champion";
  if (completedReferrals >= t.mentor) return "Mentor";
  return "Contributor";
}

export interface TierProgress {
  tier: Tier;
  completedReferrals: number;
  nextTier: Tier | null; // null when already at the top
  toNext: number | null; // how many more completions to reach the next tier
}

/** Current tier + how far to the next one. All derived — honest, no fabricated numbers. */
export function tierProgress(
  completedReferrals: number,
  t: TierThresholds = tierThresholds(),
): TierProgress {
  const tier = computeTier(completedReferrals, t);
  if (tier === "Community Champion")
    return { tier, completedReferrals, nextTier: null, toNext: null };
  if (tier === "Mentor")
    return {
      tier,
      completedReferrals,
      nextTier: "Community Champion",
      toNext: Math.max(0, t.champion - completedReferrals),
    };
  return {
    tier,
    completedReferrals,
    nextTier: "Mentor",
    toNext: Math.max(0, t.mentor - completedReferrals),
  };
}
