// Phase A (DR-036/DR-038 · DR-023) — checkout referral gate. A valid referral code is MANDATORY
// before an OTP is sent or an order is placed. The money/webhook/ledger path itself is UNCHANGED
// (covered by tests/checkout-mock.integration.test.ts); here we prove the adapter-level gate.
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  resolveSponsorByCode: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  checkOtpSendRate: vi.fn(),
  checkOtpVerifyRate: vi.fn(),
  syncUser: vi.fn(),
  placeOrder: vi.fn(),
  getPaymentProvider: vi.fn(),
  track: vi.fn(),
  anonId: vi.fn(),
}));

vi.mock("@/lib/auth/sponsor", () => ({
  resolveSponsorByCode: h.resolveSponsorByCode,
}));
vi.mock("@/lib/auth/otp", () => ({
  getOtpProvider: () => ({ sendOtp: h.sendOtp, verifyOtp: h.verifyOtp }),
}));
vi.mock("@/lib/auth/otp-rate-limit", () => ({
  checkOtpSendRate: h.checkOtpSendRate,
  checkOtpVerifyRate: h.checkOtpVerifyRate,
}));
vi.mock("@/lib/auth/user-sync", () => ({ syncUser: h.syncUser }));
vi.mock("@/lib/payments/checkout", () => ({ startCheckout: h.placeOrder }));
vi.mock("@/lib/payments/provider", () => ({
  getPaymentProvider: h.getPaymentProvider,
}));
vi.mock("@/lib/analytics/track", () => ({ track: h.track, anonId: h.anonId }));

import { startCheckout, verifyCheckoutOtp } from "@/app/checkout/actions";

const PHONE = "9812345678";

beforeEach(() => {
  vi.clearAllMocks();
  h.checkOtpSendRate.mockResolvedValue({ ok: true });
  h.checkOtpVerifyRate.mockResolvedValue({ ok: true });
  h.anonId.mockReturnValue("anon-1");
  h.sendOtp.mockResolvedValue(undefined);
});

describe("§8.6 checkout mandatory referral code", () => {
  it("startCheckout with no code → Zod-blocked, no OTP sent", async () => {
    const res = await startCheckout({
      phone: PHONE,
      packageSlug: "career-booster",
      referralCode: "",
    });
    expect(res.ok).toBe(false);
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it("startCheckout with an unknown code → generic block before OTP", async () => {
    h.resolveSponsorByCode.mockResolvedValue(null);
    const res = await startCheckout({
      phone: PHONE,
      packageSlug: "career-booster",
      referralCode: "GSBADCODE",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/valid referral code/i);
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it("startCheckout with a valid code → OTP sent (money path proceeds)", async () => {
    h.resolveSponsorByCode.mockResolvedValue({ id: "s1", firstName: "Rahul" });
    const res = await startCheckout({
      phone: PHONE,
      packageSlug: "career-booster",
      referralCode: "GS1A2B3C4D",
    });
    expect(res.ok).toBe(true);
    expect(h.sendOtp).toHaveBeenCalledWith(PHONE);
  });

  it("verifyCheckoutOtp with an unknown code never verifies OTP or places an order", async () => {
    h.resolveSponsorByCode.mockResolvedValue(null);
    const res = await verifyCheckoutOtp({
      phone: PHONE,
      token: "123456",
      packageSlug: "career-booster",
      referralCode: "GSBADCODE",
    });
    expect(res.ok).toBe(false);
    expect(h.verifyOtp).not.toHaveBeenCalled();
    expect(h.placeOrder).not.toHaveBeenCalled();
  });
});
