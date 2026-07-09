// Phase A (DR-036 §6) — password-login attempt throttle. Pure decision over the shared limiter.
import { describe, it, expect, beforeEach } from "vitest";
import { evaluateLoginAttempt } from "@/lib/auth/login-rate-limit";
import { __resetRateLimits } from "@/lib/rate-limit";

const NOW = 2_000_000;

describe("evaluateLoginAttempt", () => {
  beforeEach(() => __resetRateLimits());

  it("allows the first attempt", () => {
    expect(evaluateLoginAttempt("1.1.1.1", "9000000001", NOW).ok).toBe(true);
  });

  it("backs off a single phone after 5 attempts in the window", () => {
    const ip = "1.1.1.1";
    const phone = "9000000002";
    for (let i = 0; i < 5; i++)
      expect(evaluateLoginAttempt(ip, phone, NOW + i).ok).toBe(true);
    const blocked = evaluateLoginAttempt(ip, phone, NOW + 6);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/this number|otp/i);
  });

  it("throttles a single IP after 20 attempts across different phones", () => {
    const ip = "2.2.2.2";
    for (let i = 0; i < 20; i++)
      expect(
        evaluateLoginAttempt(ip, `90000${String(i).padStart(5, "0")}`, NOW + i)
          .ok,
      ).toBe(true);
    const blocked = evaluateLoginAttempt(ip, "9111111111", NOW + 21);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/too many/i);
  });

  it("recovers after the window elapses", () => {
    const ip = "3.3.3.3";
    const phone = "9000000003";
    for (let i = 0; i < 5; i++) evaluateLoginAttempt(ip, phone, NOW + i);
    expect(evaluateLoginAttempt(ip, phone, NOW + 6).ok).toBe(false);
    expect(evaluateLoginAttempt(ip, phone, NOW + 10 * 60 * 1000 + 1).ok).toBe(
      true,
    );
  });
});
