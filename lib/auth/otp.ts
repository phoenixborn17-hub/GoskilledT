// OTP provider adapter (Ticket 3). BOTH modes go through Supabase Auth — the ONE auth
// authority (DR-024). We never hand-roll OTP. `test` uses Supabase Dashboard test phone
// numbers (fixed codes, no SMS provider); `live` uses a real SMS provider. Same interface,
// so switching = flip OTP_PROVIDER + configure SMS in Supabase. `test` is prod-forbidden.
import { randomBytes } from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createSupabaseAdminClient } from "../supabase/admin";
import {
  assertProductionProviderSafety,
  isStagingMode,
  otpProviderName,
  type OtpProviderName,
} from "../config/providers";

export interface OtpProvider {
  readonly name: OtpProviderName;
  sendOtp(phone: string): Promise<void>; // phone = validated 10-digit Indian mobile
  verifyOtp(phone: string, token: string): Promise<{ user: User }>;
}

const e164 = (phone: string) => `+91${phone}`;

async function supabaseSend(phone: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone) });
  if (error) throw new Error(`Could not send OTP: ${error.message}`);
}

async function supabaseVerify(
  phone: string,
  token: string,
): Promise<{ user: User }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164(phone),
    token,
    type: "sms",
  });
  if (error || !data.user)
    throw new Error(
      `Invalid or expired OTP${error ? `: ${error.message}` : ""}`,
    );
  return { user: data.user };
}

/** Optional dev allowlist so a stray real number can't be used while OTP_PROVIDER=test. */
function assertDevPhoneAllowed(phone: string): void {
  const raw = process.env.DEV_TEST_PHONES;
  if (!raw) return; // unset → allow any (dev convenience)
  const allowed = raw
    .split(",")
    .map((p) => p.replace(/\D/g, "").slice(-10))
    .filter(Boolean);
  if (!allowed.includes(phone)) {
    throw new Error(
      `OTP_PROVIDER=test only allows configured Supabase test numbers (DEV_TEST_PHONES). Got ${phone}.`,
    );
  }
}

// ── Staging OTP bypass (test.goskilled.in only) ─────────────────────────────
// Lets testers register/login/checkout WITHOUT SMS. Reachable ONLY when isStagingMode() is true
// (NODE_ENV=production AND APP_ENV=staging AND a proven non-prod host). In real production, and on
// the prod domain even with APP_ENV=staging, isStagingMode() is false → this code never runs and
// the real Supabase OTP path below is used unchanged.

/** The single fixed code accepted for ANY phone in staging. Default 123456; override via env. */
function stagingOtpCode(): string {
  return process.env.STAGING_OTP_CODE?.trim() || "123456";
}

const normalizePhone = (s: string | null | undefined) =>
  (s ?? "").replace(/\D/g, "");

/** Locate an existing auth user by phone via the Admin API (paged). Null if none exists. */
async function findAuthUserByPhone(
  admin: SupabaseClient,
  phoneE164: string,
): Promise<User | null> {
  const want = normalizePhone(phoneE164);
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`Staging: listUsers failed: ${error.message}`);
    const match = data.users.find((u) => normalizePhone(u.phone) === want);
    if (match) return match;
    if (data.users.length < 200) break; // last page reached
  }
  return null;
}

/**
 * The staging provider. `sendOtp` is a no-op (no SMS, no Supabase send). `verifyOtp` accepts the
 * fixed STAGING_OTP_CODE for any phone; on match it get-or-creates the phone user (phone_confirmed)
 * via the service-role Admin API and mints a real Supabase session, returning the same `{ user }`
 * shape as the live path — so cookies, RBAC and syncUser all behave exactly as production.
 *
 * Session minting uses a FRESH RANDOM password generated per verify and immediately discarded, so no
 * reusable/guessable credential is ever persisted. REQUIRES staging to run against a NON-production
 * Supabase project (see the review packet) — it writes auth users via service_role.
 */
function stagingOtpProvider(): OtpProvider {
  return {
    name: "test", // presents as a test provider; only reachable when isStagingMode() is true
    async sendOtp() {
      // No-op: the code is fixed (STAGING_OTP_CODE); nothing is sent.
      return;
    },
    async verifyOtp(phone, token) {
      if (token !== stagingOtpCode()) {
        // Same generic message as the live path — never reveals the expected code.
        throw new Error("Invalid or expired OTP");
      }

      const admin = createSupabaseAdminClient();
      const phoneE164 = e164(phone);
      const password = randomBytes(24).toString("base64url"); // transient; never stored or returned

      // Get-or-create the phone user with a fresh password + confirmed phone.
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          phone: phoneE164,
          phone_confirm: true,
          password,
        });
      if (createErr || !created?.user) {
        // Already exists → find it and rotate to the fresh password so we can sign in.
        const existing = await findAuthUserByPhone(admin, phoneE164);
        if (!existing) {
          throw new Error(
            `Staging: could not create or find user for ${phone}${createErr ? `: ${createErr.message}` : ""}`,
          );
        }
        const { error: updErr } = await admin.auth.admin.updateUserById(
          existing.id,
          { password, phone_confirm: true },
        );
        if (updErr) {
          throw new Error(`Staging: could not update user: ${updErr.message}`);
        }
      }

      // Mint a real session on the cookie-bound client → sets auth cookies, same as live verifyOtp.
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: phoneE164,
        password,
      });
      if (error || !data.user) {
        throw new Error(
          `Staging: could not mint session${error ? `: ${error.message}` : ""}`,
        );
      }
      return { user: data.user };
    },
  };
}

export function getOtpProvider(): OtpProvider {
  assertProductionProviderSafety();
  // Staging bypass — unreachable in real production and on the prod domain (isStagingMode() requires
  // NODE_ENV=production + APP_ENV=staging + a proven non-prod host).
  if (isStagingMode()) return stagingOtpProvider();
  const name = otpProviderName();
  if (name === "test") {
    return {
      name,
      async sendOtp(phone) {
        assertDevPhoneAllowed(phone);
        return supabaseSend(phone);
      },
      async verifyOtp(phone, token) {
        assertDevPhoneAllowed(phone);
        return supabaseVerify(phone, token);
      },
    };
  }
  return { name, sendOtp: supabaseSend, verifyOtp: supabaseVerify };
}
