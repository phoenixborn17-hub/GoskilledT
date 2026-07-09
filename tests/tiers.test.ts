// Phase D · D2 — contribution tiers (DR-035). Pure.
import { describe, it, expect } from "vitest";
import {
  computeTier,
  tierProgress,
  DEFAULT_TIER_THRESHOLDS,
} from "@/modules/affiliate/tiers";

const T = { mentor: 5, champion: 15 };

describe("computeTier", () => {
  it("maps completed-referrals to the three tiers by threshold", () => {
    expect(computeTier(0, T)).toBe("Contributor");
    expect(computeTier(4, T)).toBe("Contributor");
    expect(computeTier(5, T)).toBe("Mentor");
    expect(computeTier(14, T)).toBe("Mentor");
    expect(computeTier(15, T)).toBe("Community Champion");
    expect(computeTier(99, T)).toBe("Community Champion");
  });
  it("has sane defaults", () => {
    expect(DEFAULT_TIER_THRESHOLDS.mentor).toBeGreaterThan(0);
    expect(DEFAULT_TIER_THRESHOLDS.champion).toBeGreaterThan(
      DEFAULT_TIER_THRESHOLDS.mentor,
    );
  });
});

describe("tierProgress", () => {
  it("reports the next tier + how many more completions to reach it", () => {
    expect(tierProgress(3, T)).toEqual({
      tier: "Contributor",
      completedReferrals: 3,
      nextTier: "Mentor",
      toNext: 2,
    });
    expect(tierProgress(7, T)).toEqual({
      tier: "Mentor",
      completedReferrals: 7,
      nextTier: "Community Champion",
      toNext: 8,
    });
  });
  it("tops out at Community Champion (no next tier)", () => {
    expect(tierProgress(20, T)).toEqual({
      tier: "Community Champion",
      completedReferrals: 20,
      nextTier: null,
      toNext: null,
    });
  });
});
