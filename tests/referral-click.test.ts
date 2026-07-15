// Feature Batch v1.0 §3 — pure units: visitorId shape validation + the click-endpoint rate limit.
import { describe, it, expect } from "vitest";
import { isValidVisitorId } from "@/lib/auth/visitor-cookie";
import { evaluateReferralClickRate } from "@/lib/affiliate/referral-click-rate";
import { __resetRateLimits } from "@/lib/rate-limit";

describe("isValidVisitorId", () => {
  it("accepts a well-formed UUID v4", () => {
    expect(isValidVisitorId("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("rejects non-UUID junk, empty, and missing values", () => {
    expect(isValidVisitorId("not-a-uuid")).toBe(false);
    expect(isValidVisitorId("")).toBe(false);
    expect(isValidVisitorId(null)).toBe(false);
    expect(isValidVisitorId(undefined)).toBe(false);
    expect(isValidVisitorId("<script>alert(1)</script>")).toBe(false);
  });
});

describe("evaluateReferralClickRate", () => {
  it("allows requests under the per-IP limit and blocks once exceeded", () => {
    __resetRateLimits();
    const now = Date.now();
    for (let i = 0; i < 60; i++) {
      expect(evaluateReferralClickRate("1.2.3.4", now).ok).toBe(true);
    }
    expect(evaluateReferralClickRate("1.2.3.4", now).ok).toBe(false);
  });

  it("tracks distinct IPs independently", () => {
    __resetRateLimits();
    const now = Date.now();
    for (let i = 0; i < 60; i++) evaluateReferralClickRate("9.9.9.9", now);
    expect(evaluateReferralClickRate("9.9.9.9", now).ok).toBe(false);
    expect(evaluateReferralClickRate("8.8.8.8", now).ok).toBe(true);
  });
});
