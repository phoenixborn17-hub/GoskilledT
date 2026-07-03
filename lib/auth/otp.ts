// OTP provider adapter (Ticket 3). BOTH modes go through Supabase Auth — the ONE auth
// authority (DR-024). We never hand-roll OTP. `test` uses Supabase Dashboard test phone
// numbers (fixed codes, no SMS provider); `live` uses a real SMS provider. Same interface,
// so switching = flip OTP_PROVIDER + configure SMS in Supabase. `test` is prod-forbidden.
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import {
  assertProductionProviderSafety,
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

export function getOtpProvider(): OtpProvider {
  assertProductionProviderSafety();
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
