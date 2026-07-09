// Phone + password auth (DR-036). Supabase Auth stays the single identity authority (DR-024) —
// passwords are hashed/stored BY SUPABASE, never in our tables (no passwordHash column). These
// helpers wrap the cookie-bound server client so sessions/cookies behave exactly like the OTP path.
// Passwords are NEVER logged (§6): errors are generic and carry no credential material.
import { createSupabaseServerClient } from "../supabase/server";
import type { User } from "@supabase/supabase-js";

const e164 = (phone: string) => `+91${phone}`;

/** Password policy (§6): min 8 chars, configurable via MIN_PASSWORD_LENGTH (LAUNCH_CONFIG). */
export function minPasswordLength(): number {
  const raw = Number(process.env.MIN_PASSWORD_LENGTH);
  return Number.isInteger(raw) && raw >= 8 ? raw : 8;
}

/** Pure policy check → a human message, or null when the password is acceptable. Unit-testable. */
export function passwordIssue(password: string): string | null {
  const min = minPasswordLength();
  if (typeof password !== "string" || password.length < min)
    return `Password must be at least ${min} characters`;
  return null;
}

/**
 * Sign in with mobile + password → mints a real Supabase session on the cookie-bound server client
 * (sets auth cookies, same as the OTP path). Generic error on any failure — never reveals whether
 * the number exists vs. the password was wrong (no user-enumeration, §6).
 */
export async function signInWithPassword(
  phone: string,
  password: string,
): Promise<{ user: User }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: e164(phone),
    password,
  });
  if (error || !data.user)
    throw new Error("Incorrect mobile number or password");
  return { user: data.user };
}

/**
 * Set/replace the password on the CURRENT authenticated session. Called right after an OTP verify
 * (registration sets the chosen password; the reset flow replaces it) — the OTP verify has already
 * established the session, so updateUser mutates the right user. Requires an active session.
 */
export async function setPasswordForCurrentUser(
  password: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error("Could not set your password. Please try again.");
}
