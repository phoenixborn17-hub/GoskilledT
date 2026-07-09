// Registration server actions (Phase A — DR-036/DR-038). Invite-only: a VALID referral code is
// MANDATORY before anything happens. Flow: validate code → collect mobile+password(+name) → OTP →
// create the Supabase phone+password user → get-or-create our User with referredById = sponsor.
// Auth backend stays Supabase (DR-024); the staging OTP bypass is used transparently via getOtpProvider.
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import { checkOtpSendRate } from "../../lib/auth/otp-rate-limit";
import { syncUser } from "../../lib/auth/user-sync";
import { resolveSponsorByCode } from "../../lib/auth/sponsor";
import {
  passwordIssue,
  setPasswordForCurrentUser,
} from "../../lib/auth/password";
import { ensureGettingStartedEnrollment } from "../../lib/lms/getting-started";
import { postAuthRedirect } from "../../lib/auth/post-auth";
import { prisma } from "../../lib/prisma";
import { track } from "../../lib/analytics/track";

export type SendResult = { ok: true } | { ok: false; error: string };
export type RegisterResult =
  { ok: true; redirectTo: string } | { ok: false; error: string };
export type ValidateCodeResult =
  { ok: true; sponsorFirstName: string | null } | { ok: false; error: string };

// One generic message for empty AND unknown codes — never reveals which codes exist (§6).
const INVALID_CODE = "Enter a valid referral code";

const codeSchema = z.string().trim().min(1).max(24);
const passwordField = z.string().min(1, "Create a password");

const sendSchema = z.object({
  phone: phoneSchema,
  referralCode: codeSchema,
  password: passwordField,
});
const verifySchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the OTP"),
  referralCode: codeSchema,
  password: passwordField,
  // Optional single name field (Blueprint §3). Email is NOT asked here.
  name: z.string().trim().max(80).optional(),
});

/**
 * Step 1 gate: resolve a manually-entered referral code (the register page validates a `?ref=`
 * code itself). Returns the sponsor's first name for a warm "Invited by …", or a generic error.
 */
export async function validateReferralCode(
  rawCode: string,
): Promise<ValidateCodeResult> {
  const sponsor = await resolveSponsorByCode(rawCode);
  if (!sponsor) return { ok: false, error: INVALID_CODE };
  return { ok: true, sponsorFirstName: sponsor.firstName };
}

export async function sendRegisterOtp(
  input: z.input<typeof sendSchema>,
): Promise<SendResult> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  // Re-validate the mandatory code server-side — never trust the client (§6). No valid code → no SMS.
  const sponsor = await resolveSponsorByCode(parsed.data.referralCode);
  if (!sponsor) return { ok: false, error: INVALID_CODE };
  const pwIssue = passwordIssue(parsed.data.password);
  if (pwIssue) return { ok: false, error: pwIssue };

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

export async function verifyRegisterOtp(
  input: z.input<typeof verifySchema>,
): Promise<RegisterResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid OTP",
    };

  // The referral code is MANDATORY and re-validated here (defence in depth — a tampered client
  // could skip step 1). No sponsor → refuse to create the account.
  const sponsor = await resolveSponsorByCode(parsed.data.referralCode);
  if (!sponsor) return { ok: false, error: INVALID_CODE };
  const pwIssue = passwordIssue(parsed.data.password);
  if (pwIssue) return { ok: false, error: pwIssue };

  try {
    const { user } = await getOtpProvider().verifyOtp(
      parsed.data.phone,
      parsed.data.token,
    );

    // Is this a brand-new account? Decide BEFORE sync so `account_created` fires exactly once.
    const existing = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { name: true, welcomeSeenAt: true },
    });

    // OTP verify established the session → set the chosen password on this Supabase user.
    await setPasswordForCurrentUser(parsed.data.password);

    // The mandatory code IS the attribution for a new registration. syncUser resolves it to
    // referredById on create; for a pre-existing phone row it fills referral only if it had none
    // (first-touch preserved — a returning user keeps their original upline).
    const synced = await syncUser(user, parsed.data.referralCode);

    // Optional name from the register form — set only if we don't already have one.
    const name = parsed.data.name?.trim();
    if (name && !existing?.name) {
      await prisma.user.update({ where: { id: synced.id }, data: { name } });
    }

    // Auto-enroll Lesson 0. Best-effort — a hiccup must never fail the signup.
    try {
      await ensureGettingStartedEnrollment(synced.id);
    } catch {
      /* free-preview access still lets them play Lesson 0 */
    }

    if (!existing) {
      await track("account_created", synced.id, {
        source: "register",
        ref_attributed: !!synced.referredById,
      });
    }

    // Single post-auth redirect (§4.5): new accounts → one-time /welcome; returning → Hub.
    return { ok: true, redirectTo: await postAuthRedirect(synced.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid OTP" };
  }
}
