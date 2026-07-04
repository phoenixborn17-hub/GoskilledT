// GPS-M4 carried ticket — OTP-send throttle (per-IP + per-phone). Pure decision over the shared
// limiter; no DB, no request context.
import { describe, it, expect, beforeEach } from "vitest";
import { evaluateOtpSend } from "@/lib/auth/otp-rate-limit";
import { __resetRateLimits } from "@/lib/rate-limit";

const NOW = 1_000_000;

describe("evaluateOtpSend", () => {
  beforeEach(() => __resetRateLimits());

  it("allows a first send", () => {
    expect(evaluateOtpSend("1.1.1.1", "9000000001", NOW).ok).toBe(true);
  });

  it("throttles a single phone after 4 sends in the window", () => {
    const ip = "1.1.1.1";
    const phone = "9000000002";
    for (let i = 0; i < 4; i++)
      expect(evaluateOtpSend(ip, phone, NOW + i).ok).toBe(true);
    const blocked = evaluateOtpSend(ip, phone, NOW + 5);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/this number/i);
  });

  it("throttles a single IP after 8 sends across different phones", () => {
    const ip = "2.2.2.2";
    // 8 distinct phones (each 1 send → phone limit never hit) exhausts the per-IP budget.
    for (let i = 0; i < 8; i++)
      expect(evaluateOtpSend(ip, `90000001${i}`, NOW + i).ok).toBe(true);
    const blocked = evaluateOtpSend(ip, "900000019", NOW + 9);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/too many/i);
  });

  it("recovers after the window elapses", () => {
    const ip = "3.3.3.3";
    const phone = "9000000003";
    for (let i = 0; i < 4; i++) evaluateOtpSend(ip, phone, NOW + i);
    expect(evaluateOtpSend(ip, phone, NOW + 5).ok).toBe(false);
    // 10 min + 1ms later the window has rolled over.
    expect(evaluateOtpSend(ip, phone, NOW + 10 * 60 * 1000 + 1).ok).toBe(true);
  });
});
