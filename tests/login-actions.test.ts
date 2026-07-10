// Phase A (DR-036) — /login server actions. Password sign-in (§8.4), OTP sign-in, and OTP-based
// password reset (§8.5). Supabase / DB / SMS boundaries mocked so adapter logic runs deterministically.
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  setPasswordForCurrentUser: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  checkOtpSendRate: vi.fn(),
  checkLoginRate: vi.fn(),
  syncUser: vi.fn(),
  readRefCookie: vi.fn(),
  postAuthRedirect: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  signInWithPassword: h.signInWithPassword,
  setPasswordForCurrentUser: h.setPasswordForCurrentUser,
  passwordIssue: (pw: string) =>
    typeof pw === "string" && pw.length >= 8
      ? null
      : "Password must be at least 8 characters",
}));
vi.mock("@/lib/auth/otp", () => ({
  getOtpProvider: () => ({ sendOtp: h.sendOtp, verifyOtp: h.verifyOtp }),
}));
vi.mock("@/lib/auth/otp-rate-limit", () => ({
  checkOtpSendRate: h.checkOtpSendRate,
}));
vi.mock("@/lib/auth/login-rate-limit", () => ({
  checkLoginRate: h.checkLoginRate,
}));
vi.mock("@/lib/auth/user-sync", () => ({ syncUser: h.syncUser }));
vi.mock("@/lib/auth/ref-cookie", () => ({ readRefCookie: h.readRefCookie }));
vi.mock("@/lib/auth/post-auth", () => ({
  postAuthRedirect: h.postAuthRedirect,
}));

import {
  loginWithPassword,
  verifyLoginOtp,
  resetPasswordWithOtp,
} from "@/app/login/actions";

const PHONE = "9812345678";

beforeEach(() => {
  vi.clearAllMocks();
  h.checkLoginRate.mockResolvedValue({ ok: true });
  h.checkOtpSendRate.mockResolvedValue({ ok: true });
  h.readRefCookie.mockResolvedValue(undefined);
  h.syncUser.mockResolvedValue({
    id: "u-1",
    referredById: null,
    referralCode: "GSX",
  });
  h.postAuthRedirect.mockResolvedValue("/dashboard/home");
});

describe("§8.4 password login", () => {
  it("valid password → synced + redirected via the single post-auth rule", async () => {
    h.signInWithPassword.mockResolvedValue({
      user: { id: "sb-1", phone: `+91${PHONE}` },
    });
    const res = await loginWithPassword({
      phone: PHONE,
      password: "hunter2pass",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.redirectTo).toBe("/dashboard/home");
    expect(h.postAuthRedirect).toHaveBeenCalledWith("u-1", undefined);
  });

  it("wrong password → generic error, rate-limited path", async () => {
    h.signInWithPassword.mockRejectedValue(
      new Error("Incorrect mobile number or password"),
    );
    const res = await loginWithPassword({
      phone: PHONE,
      password: "wrongpass1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/incorrect/i);
  });

  it("rate-limited → blocked before hitting Supabase", async () => {
    h.checkLoginRate.mockResolvedValue({
      ok: false,
      error: "Too many attempts",
    });
    const res = await loginWithPassword({
      phone: PHONE,
      password: "hunter2pass",
    });
    expect(res.ok).toBe(false);
    expect(h.signInWithPassword).not.toHaveBeenCalled();
  });

  it("honours a safe next; a bounced deep-link flows through postAuthRedirect", async () => {
    h.signInWithPassword.mockResolvedValue({
      user: { id: "sb-1", phone: `+91${PHONE}` },
    });
    h.postAuthRedirect.mockResolvedValue("/dashboard/earn");
    const res = await loginWithPassword({
      phone: PHONE,
      password: "hunter2pass",
      next: "/dashboard/earn",
    });
    expect(res.ok).toBe(true);
    expect(h.postAuthRedirect).toHaveBeenCalledWith("u-1", "/dashboard/earn");
  });
});

describe("OTP alternative sign-in", () => {
  it("valid OTP → synced + redirected", async () => {
    h.verifyOtp.mockResolvedValue({
      user: { id: "sb-2", phone: `+91${PHONE}` },
    });
    const res = await verifyLoginOtp({ phone: PHONE, token: "123456" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.redirectTo).toBe("/dashboard/home");
  });
});

describe("§8.5 password reset via OTP", () => {
  it("verify OTP → set new password → signed in + redirected", async () => {
    h.verifyOtp.mockResolvedValue({
      user: { id: "sb-3", phone: `+91${PHONE}` },
    });
    const res = await resetPasswordWithOtp({
      phone: PHONE,
      token: "123456",
      password: "brandnew123",
    });
    expect(res.ok).toBe(true);
    expect(h.setPasswordForCurrentUser).toHaveBeenCalledWith("brandnew123");
  });

  it("rejects a weak new password before verifying OTP", async () => {
    const res = await resetPasswordWithOtp({
      phone: PHONE,
      token: "123456",
      password: "short",
    });
    expect(res.ok).toBe(false);
    expect(h.verifyOtp).not.toHaveBeenCalled();
  });
});
