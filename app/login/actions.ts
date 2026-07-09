// Login server actions (Phase A — DR-036). Primary path = mobile + PASSWORD. OTP is offered as an
// alternative sign-in AND as password RESET (phone is the identity — no forgot-password email).
// Supabase stays the single auth authority (DR-024); the staging OTP bypass works via getOtpProvider.
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import { checkOtpSendRate } from "../../lib/auth/otp-rate-limit";
import { checkLoginRate } from "../../lib/auth/login-rate-limit";
import {
  signInWithPassword,
  setPasswordForCurrentUser,
  passwordIssue,
} from "../../lib/auth/password";
import { syncUser } from "../../lib/auth/user-sync";
import { readRefCookie } from "../../lib/auth/ref-cookie";
import { postAuthRedirect } from "../../lib/auth/post-auth";

export type LoginResult = { ok: true } | { ok: false; error: string };
export type LoginRedirectResult =
  { ok: true; redirectTo: string } | { ok: false; error: string };

const sendSchema = z.object({ phone: phoneSchema });
const nextField = z.string().optional();
const otpToken = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "Enter the OTP");

const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
  next: nextField,
});
const verifyOtpSchema = z.object({
  phone: phoneSchema,
  token: otpToken,
  next: nextField,
});
const resetSchema = z.object({
  phone: phoneSchema,
  token: otpToken,
  password: z.string().min(1, "Create a password"),
  next: nextField,
});

/** Send an OTP — used for BOTH the OTP sign-in alternative and starting a password reset. */
export async function sendLoginOtp(
  input: z.input<typeof sendSchema>,
): Promise<LoginResult> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid phone",
    };
  const rl = await checkOtpSendRate(parsed.data.phone);
  if (!rl.ok) return { ok: false, error: rl.error };
  try {
    await getOtpProvider().sendOtp(parsed.data.phone);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send OTP",
    };
  }
}

/** Primary sign-in: mobile + password. Rate-limited (§6); generic error (no user-enumeration). */
export async function loginWithPassword(
  input: z.input<typeof passwordLoginSchema>,
): Promise<LoginRedirectResult> {
  const parsed = passwordLoginSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  const rl = await checkLoginRate(parsed.data.phone);
  if (!rl.ok) return { ok: false, error: rl.error };
  try {
    const { user } = await signInWithPassword(
      parsed.data.phone,
      parsed.data.password,
    );
    const synced = await syncUser(user, await readRefCookie());
    return {
      ok: true,
      redirectTo: await postAuthRedirect(synced.id, parsed.data.next),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Incorrect mobile number or password",
    };
  }
}

/** Alternative sign-in via OTP (no password needed). Redirects via the single post-auth rule. */
export async function verifyLoginOtp(
  input: z.input<typeof verifyOtpSchema>,
): Promise<LoginRedirectResult> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid OTP",
    };
  try {
    const { user } = await getOtpProvider().verifyOtp(
      parsed.data.phone,
      parsed.data.token,
    );
    // First-touch ref capture still applies (a genuinely new user landing here with ?ref=);
    // syncUser never overwrites an existing attribution.
    const synced = await syncUser(user, await readRefCookie());
    return {
      ok: true,
      redirectTo: await postAuthRedirect(synced.id, parsed.data.next),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid OTP" };
  }
}

/** Password reset (§4.3): verify OTP → set a new password → signed in. No email link — phone is identity. */
export async function resetPasswordWithOtp(
  input: z.input<typeof resetSchema>,
): Promise<LoginRedirectResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  const pwIssue = passwordIssue(parsed.data.password);
  if (pwIssue) return { ok: false, error: pwIssue };
  try {
    // OTP verify establishes the session → updateUser sets the new password on THIS user.
    const { user } = await getOtpProvider().verifyOtp(
      parsed.data.phone,
      parsed.data.token,
    );
    await setPasswordForCurrentUser(parsed.data.password);
    const synced = await syncUser(user, await readRefCookie());
    return {
      ok: true,
      redirectTo: await postAuthRedirect(synced.id, parsed.data.next),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not reset your password",
    };
  }
}
