// Phase A (DR-036/DR-038) — /register server actions. Referral-code gate + password enforcement +
// single post-auth redirect. Supabase / DB / SMS boundaries are mocked so the ADAPTER LOGIC is
// exercised deterministically (no live project, no SMS). Covers acceptance tests §8.1–§8.3.
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  resolveSponsorByCode: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  checkOtpSendRate: vi.fn(),
  checkOtpVerifyRate: vi.fn(),
  setPasswordForCurrentUser: vi.fn(),
  syncUser: vi.fn(),
  ensureGettingStartedEnrollment: vi.fn(),
  postAuthRedirect: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  track: vi.fn(),
  isFeatureVisible: vi.fn(),
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
vi.mock("@/lib/auth/password", () => ({
  passwordIssue: (pw: string) =>
    typeof pw === "string" && pw.length >= 8
      ? null
      : "Password must be at least 8 characters",
  setPasswordForCurrentUser: h.setPasswordForCurrentUser,
}));
vi.mock("@/lib/auth/user-sync", () => ({ syncUser: h.syncUser }));
vi.mock("@/lib/lms/getting-started", () => ({
  ensureGettingStartedEnrollment: h.ensureGettingStartedEnrollment,
}));
vi.mock("@/lib/auth/post-auth", () => ({
  postAuthRedirect: h.postAuthRedirect,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: h.findUnique, update: h.update } },
}));
vi.mock("@/lib/analytics/track", () => ({ track: h.track }));
// DR-040: validateReferralCode suppresses the sponsor-name reveal when the Affiliate layer is hidden.
vi.mock("@/lib/feature-visibility/context", () => ({
  isFeatureVisible: h.isFeatureVisible,
}));

import {
  validateReferralCode,
  sendRegisterOtp,
  verifyRegisterOtp,
} from "@/app/register/actions";

const PHONE = "9812345678";
const CODE = "GS1A2B3C4D";
const PW = "hunter2pass";

beforeEach(() => {
  vi.clearAllMocks();
  h.checkOtpSendRate.mockResolvedValue({ ok: true });
  h.checkOtpVerifyRate.mockResolvedValue({ ok: true });
  h.sendOtp.mockResolvedValue(undefined);
  h.verifyOtp.mockResolvedValue({
    user: { id: "sb-new-1", phone: `+91${PHONE}` },
  });
  h.setPasswordForCurrentUser.mockResolvedValue(undefined);
  h.syncUser.mockResolvedValue({
    id: "u-1",
    referredById: "sponsor-1",
    referralCode: "GSXXXX",
  });
  h.ensureGettingStartedEnrollment.mockResolvedValue(undefined);
  h.postAuthRedirect.mockResolvedValue("/welcome");
  h.findUnique.mockResolvedValue(null); // brand-new account
  h.isFeatureVisible.mockResolvedValue(true); // Affiliate visible by default
});

describe("§8.1 register without a code → blocked", () => {
  it("sendRegisterOtp with empty code never sends an OTP", async () => {
    const res = await sendRegisterOtp({
      phone: PHONE,
      referralCode: "",
      password: PW,
    });
    expect(res.ok).toBe(false);
    expect(h.sendOtp).not.toHaveBeenCalled();
    expect(h.resolveSponsorByCode).not.toHaveBeenCalled(); // Zod blocks before any lookup
  });
});

describe("§8.2 invalid code → generic block", () => {
  it("sendRegisterOtp with an unknown code is refused with a generic error, no OTP", async () => {
    h.resolveSponsorByCode.mockResolvedValue(null);
    const res = await sendRegisterOtp({
      phone: PHONE,
      referralCode: "GSBADCODE",
      password: PW,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/valid referral code/i);
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it("verifyRegisterOtp with an unknown code never verifies OTP or creates an account", async () => {
    h.resolveSponsorByCode.mockResolvedValue(null);
    const res = await verifyRegisterOtp({
      phone: PHONE,
      token: "123456",
      referralCode: "GSBADCODE",
      password: PW,
    });
    expect(res.ok).toBe(false);
    expect(h.verifyOtp).not.toHaveBeenCalled();
    expect(h.setPasswordForCurrentUser).not.toHaveBeenCalled();
  });

  it("validateReferralCode surfaces sponsor first name on hit, generic error on miss", async () => {
    h.resolveSponsorByCode.mockResolvedValueOnce({
      id: "s1",
      firstName: "Rahul",
    });
    expect(await validateReferralCode(CODE)).toEqual({
      ok: true,
      sponsorFirstName: "Rahul",
    });
    h.resolveSponsorByCode.mockResolvedValueOnce(null);
    const miss = await validateReferralCode("GSNOPE");
    expect(miss.ok).toBe(false);
  });

  it("validateReferralCode suppresses the sponsor name when Affiliate is hidden (DR-040), but still validates", async () => {
    h.resolveSponsorByCode.mockResolvedValueOnce({
      id: "s1",
      firstName: "Rahul",
    });
    h.isFeatureVisible.mockResolvedValueOnce(false); // Affiliate globally hidden
    // Code is still VALID (registration works) — only the "Invited by [name]" reveal is suppressed.
    expect(await validateReferralCode(CODE)).toEqual({
      ok: true,
      sponsorFirstName: null,
    });
  });
});

describe("weak password → blocked before SMS / account", () => {
  it("sendRegisterOtp refuses a short password (valid code) without sending OTP", async () => {
    h.resolveSponsorByCode.mockResolvedValue({ id: "s1", firstName: "Rahul" });
    const res = await sendRegisterOtp({
      phone: PHONE,
      referralCode: CODE,
      password: "short",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/at least 8/i);
    expect(h.sendOtp).not.toHaveBeenCalled();
  });
});

describe("§8.3 valid code → account created, attributed, → welcome", () => {
  it("sendRegisterOtp with a valid code + password sends the OTP", async () => {
    h.resolveSponsorByCode.mockResolvedValue({ id: "s1", firstName: "Rahul" });
    const res = await sendRegisterOtp({
      phone: PHONE,
      referralCode: CODE,
      password: PW,
    });
    expect(res.ok).toBe(true);
    expect(h.sendOtp).toHaveBeenCalledWith(PHONE);
  });

  it("verifyRegisterOtp sets password, syncs with the code, and redirects new users to /welcome", async () => {
    h.resolveSponsorByCode.mockResolvedValue({
      id: "sponsor-1",
      firstName: "Rahul",
    });
    const res = await verifyRegisterOtp({
      phone: PHONE,
      token: "123456",
      referralCode: CODE,
      password: PW,
      name: "Asha",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.redirectTo).toBe("/welcome");
    expect(h.setPasswordForCurrentUser).toHaveBeenCalledWith(PW);
    expect(h.syncUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sb-new-1" }),
      CODE,
    );
    expect(h.track).toHaveBeenCalledWith(
      "account_created",
      "u-1",
      expect.objectContaining({ ref_attributed: true }),
    );
  });
});
