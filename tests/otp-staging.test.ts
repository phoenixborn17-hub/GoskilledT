import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isStagingMode } from "@/lib/config/providers";

// Auth path — the staging OTP bypass must be reachable ONLY in staging (test.goskilled.in) and
// NEVER in real production or on the prod domain. We mock the Supabase boundaries so tests exercise
// the branching + code-check logic without a live project.

const h = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  verifyOtp: vi.fn(),
  signInWithOtp: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  listUsers: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: h.createSupabaseServerClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: h.createSupabaseAdminClient,
}));

// Imported AFTER the mocks are registered (vi.mock is hoisted, so this is safe).
import { getOtpProvider } from "@/lib/auth/otp";

const FAKE_USER = {
  id: "user-uuid-123",
  phone: "919812345678",
} as unknown as import("@supabase/supabase-js").User;
const PHONE = "9812345678";
const E164 = "+919812345678";

const KEYS = [
  "NODE_ENV",
  "APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "OTP_PROVIDER",
  "PAYMENT_PROVIDER",
  "VIDEO_PROVIDER",
  "STAGING_OTP_CODE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SUPA = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
};
const STAGING = {
  NODE_ENV: "production",
  APP_ENV: "staging",
  NEXT_PUBLIC_APP_URL: "https://test.goskilled.in",
  ...SUPA,
};
const REAL_PROD = {
  NODE_ENV: "production",
  NEXT_PUBLIC_APP_URL: "https://goskilled.in",
  OTP_PROVIDER: "live",
  PAYMENT_PROVIDER: "razorpay",
  VIDEO_PROVIDER: "stream",
  ...SUPA,
};

const ENV = process.env as Record<string, string | undefined>;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of KEYS) saved[k] = ENV[k];
  vi.clearAllMocks();
  // Default happy-path wiring for the mocked Supabase boundaries.
  h.createSupabaseAdminClient.mockReturnValue({
    auth: {
      admin: {
        createUser: h.createUser,
        updateUserById: h.updateUserById,
        listUsers: h.listUsers,
      },
    },
  });
  h.createSupabaseServerClient.mockResolvedValue({
    auth: {
      signInWithPassword: h.signInWithPassword,
      verifyOtp: h.verifyOtp,
      signInWithOtp: h.signInWithOtp,
    },
  });
  vi.spyOn(console, "warn").mockImplementation(() => {}); // silence the staging boot warning
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete ENV[k];
    else ENV[k] = saved[k];
  }
  vi.restoreAllMocks();
});

function setEnv(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete ENV[k];
  for (const [k, v] of Object.entries(env)) ENV[k] = v;
}

describe("staging OTP bypass — auth safety", () => {
  it("staging + CORRECT code → get-or-creates user + mints a session { user }", async () => {
    setEnv(STAGING); // STAGING_OTP_CODE unset → default 123456
    h.createUser.mockResolvedValue({
      data: { user: { id: "new-1" } },
      error: null,
    });
    h.signInWithPassword.mockResolvedValue({
      data: { user: FAKE_USER },
      error: null,
    });

    expect(isStagingMode()).toBe(true);
    const res = await getOtpProvider().verifyOtp(PHONE, "123456");

    expect(res.user.id).toBe(FAKE_USER.id);
    expect(h.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ phone: E164, phone_confirm: true }),
    );
    expect(h.signInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ phone: E164 }),
    );
    expect(h.verifyOtp).not.toHaveBeenCalled(); // real SMS-verify path NOT used
  });

  it("staging + WRONG code → rejects and touches NO Supabase (no create, no session)", async () => {
    setEnv(STAGING);
    await expect(getOtpProvider().verifyOtp(PHONE, "000000")).rejects.toThrow(
      /invalid or expired otp/i,
    );
    expect(h.createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(h.signInWithPassword).not.toHaveBeenCalled();
  });

  it("staging + existing user → rotates password via updateUserById, still mints a session", async () => {
    setEnv(STAGING);
    h.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "phone already registered" },
    });
    h.listUsers.mockResolvedValue({
      data: { users: [{ id: "existing-9", phone: "919812345678" }] },
      error: null,
    });
    h.updateUserById.mockResolvedValue({ error: null });
    h.signInWithPassword.mockResolvedValue({
      data: { user: FAKE_USER },
      error: null,
    });

    const res = await getOtpProvider().verifyOtp(PHONE, "123456");
    expect(h.updateUserById).toHaveBeenCalledWith(
      "existing-9",
      expect.objectContaining({ phone_confirm: true }),
    );
    expect(res.user.id).toBe(FAKE_USER.id);
  });

  it("staging sendOtp → no-op (no SMS, no Supabase send)", async () => {
    setEnv(STAGING);
    await expect(getOtpProvider().sendOtp(PHONE)).resolves.toBeUndefined();
    expect(h.createSupabaseServerClient).not.toHaveBeenCalled();
    expect(h.signInWithOtp).not.toHaveBeenCalled();
  });

  it("STAGING_OTP_CODE override is respected (default no longer accepted)", async () => {
    setEnv({ ...STAGING, STAGING_OTP_CODE: "999111" });
    await expect(getOtpProvider().verifyOtp(PHONE, "123456")).rejects.toThrow(
      /invalid or expired otp/i,
    );
    h.createUser.mockResolvedValue({
      data: { user: { id: "new-2" } },
      error: null,
    });
    h.signInWithPassword.mockResolvedValue({
      data: { user: FAKE_USER },
      error: null,
    });
    const res = await getOtpProvider().verifyOtp(PHONE, "999111");
    expect(res.user.id).toBe(FAKE_USER.id);
  });

  it("REAL production (not staging) → bypass never runs; the fixed code hits real SMS-verify", async () => {
    setEnv(REAL_PROD); // live/razorpay/stream → guard passes, isStagingMode() false
    h.verifyOtp.mockResolvedValue({ data: { user: FAKE_USER }, error: null });

    expect(isStagingMode()).toBe(false);
    const res = await getOtpProvider().verifyOtp(PHONE, "123456"); // the staging code…

    // …went to the REAL Supabase SMS verify, and the bypass did NOT create a user.
    expect(h.verifyOtp).toHaveBeenCalledWith({
      phone: E164,
      token: "123456",
      type: "sms",
    });
    expect(h.createUser).not.toHaveBeenCalled();
    expect(res.user.id).toBe(FAKE_USER.id);
  });

  it("prod HOST + APP_ENV=staging + real providers → real OTP (bypass not active)", async () => {
    setEnv({ ...REAL_PROD, APP_ENV: "staging" }); // staging flag but on goskilled.in
    h.verifyOtp.mockResolvedValue({ data: { user: FAKE_USER }, error: null });

    expect(isStagingMode()).toBe(false);
    await getOtpProvider().verifyOtp(PHONE, "123456");
    expect(h.verifyOtp).toHaveBeenCalled();
    expect(h.createUser).not.toHaveBeenCalled();
  });

  it("prod HOST + APP_ENV=staging + mock providers → hard-throws (bypass unreachable on prod domain)", () => {
    setEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: "https://goskilled.in",
      ...SUPA,
    });
    expect(() => getOtpProvider()).toThrow(
      /development providers enabled in production/i,
    );
    expect(h.createUser).not.toHaveBeenCalled();
  });
});
