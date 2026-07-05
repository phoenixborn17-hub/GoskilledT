// §2.6 referral milestone tier boundaries (pure). Locks the derived thresholds so the celebration
// fires at the right counts. D-29: these are counts only — no earnings anywhere in the domain.
import { describe, it, expect } from "vitest";
import {
  REFERRAL_TIERS,
  highestReachedTier,
  nextTier,
} from "@/modules/affiliate/milestone";

describe("referral milestone tiers", () => {
  it("no tier reached below the first threshold", () => {
    expect(highestReachedTier(0)).toBe(0);
    expect(nextTier(0)).toBe(1);
  });

  it("reaches a tier exactly at its threshold", () => {
    expect(highestReachedTier(1)).toBe(1);
    expect(highestReachedTier(5)).toBe(5);
    expect(highestReachedTier(10)).toBe(10);
    expect(highestReachedTier(25)).toBe(25);
  });

  it("holds the tier between thresholds and points to the next", () => {
    expect(highestReachedTier(4)).toBe(1);
    expect(nextTier(4)).toBe(5);
    expect(highestReachedTier(9)).toBe(5);
    expect(nextTier(9)).toBe(10);
  });

  it("caps at the top tier — no next beyond the last", () => {
    expect(highestReachedTier(100)).toBe(25);
    expect(nextTier(25)).toBeNull();
    expect(nextTier(100)).toBeNull();
  });

  it("tiers are strictly ascending", () => {
    for (let i = 1; i < REFERRAL_TIERS.length; i++) {
      expect(REFERRAL_TIERS[i]).toBeGreaterThan(REFERRAL_TIERS[i - 1]);
    }
  });
});
