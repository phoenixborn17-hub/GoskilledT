// Launch hardening Unit 3 — per-user/per-IP throttle for authenticated write actions. Pure decision.
import { describe, it, expect, beforeEach } from "vitest";
import { evaluateActionRate } from "@/lib/auth/action-rate-limit";
import { __resetRateLimits } from "@/lib/rate-limit";

const NOW = 5_000_000;

describe("evaluateActionRate", () => {
  beforeEach(() => __resetRateLimits());

  it("allows a user up to `max` in the window, then blocks", () => {
    for (let i = 0; i < 6; i++)
      expect(
        evaluateActionRate("withdraw-request", "u1", "1.1.1.1", 6, NOW + i).ok,
      ).toBe(true);
    const blocked = evaluateActionRate(
      "withdraw-request",
      "u1",
      "1.1.1.1",
      6,
      NOW + 7,
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/too many/i);
  });

  it("throttles per user independently (a second user is unaffected)", () => {
    for (let i = 0; i < 6; i++)
      evaluateActionRate("kyc-submit", "u1", "1.1.1.1", 6, NOW + i);
    expect(
      evaluateActionRate("kyc-submit", "u1", "1.1.1.1", 6, NOW + 7).ok,
    ).toBe(false);
    // Different user, different IP → fresh budget.
    expect(
      evaluateActionRate("kyc-submit", "u2", "2.2.2.2", 6, NOW + 8).ok,
    ).toBe(true);
  });

  it("also enforces a wider per-IP cap (max*3) across users behind one IP", () => {
    // 18 requests from one IP across 18 distinct users (each 1 → never hits the per-user cap).
    for (let i = 0; i < 18; i++)
      expect(
        evaluateActionRate("kyc-doc", `user${i}`, "9.9.9.9", 6, NOW + i).ok,
      ).toBe(true);
    const blocked = evaluateActionRate(
      "kyc-doc",
      "user999",
      "9.9.9.9",
      6,
      NOW + 19,
    );
    expect(blocked.ok).toBe(false);
  });

  it("recovers after the window elapses", () => {
    for (let i = 0; i < 6; i++)
      evaluateActionRate("kyc-submit", "u1", "1.1.1.1", 6, NOW + i);
    expect(
      evaluateActionRate("kyc-submit", "u1", "1.1.1.1", 6, NOW + 7).ok,
    ).toBe(false);
    expect(
      evaluateActionRate(
        "kyc-submit",
        "u1",
        "1.1.1.1",
        6,
        NOW + 10 * 60 * 1000 + 1,
      ).ok,
    ).toBe(true);
  });
});
