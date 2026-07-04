// Registration server actions (DR-030 §3). FREE account creation, decoupled from purchase. Same
// Supabase OTP + syncUser as login/checkout — the auth BACKEND is explicitly unchanged (DR-030).
// This adapter is thin: verify OTP → read first-touch ref cookie → syncUser (attribution) →
// auto-enroll Lesson 0 → route to the one-time /welcome (or straight to the Hub for returning users).
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import { checkOtpSendRate } from "../../lib/auth/otp-rate-limit";
import { syncUser } from "../../lib/auth/user-sync";
import { readRefCookie } from "../../lib/auth/ref-cookie";
import { ensureGettingStartedEnrollment } from "../../lib/lms/getting-started";
import { prisma } from "../../lib/prisma";
import { track } from "../../lib/analytics/track";

export type SendResult = { ok: true } | { ok: false; error: string };
export type RegisterResult =
  { ok: true; redirectTo: string } | { ok: false; error: string };

const sendSchema = z.object({ phone: phoneSchema });
const verifySchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the OTP"),
  // Optional single name field (DR-030 §2 — "aap kya sunna pasand karoge?"). Email is NOT asked here.
  name: z.string().trim().max(80).optional(),
});

export async function sendRegisterOtp(
  input: z.input<typeof sendSchema>,
): Promise<SendResult> {
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

export async function verifyRegisterOtp(
  input: z.input<typeof verifySchema>,
): Promise<RegisterResult> {
  const parsed = verifySchema.safeParse(input);
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

    // Is this a brand-new account? Decide BEFORE sync so `account_created` fires exactly once.
    const existing = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { name: true, welcomeSeenAt: true },
    });

    // First-touch attribution: cookie ref wins; syncUser's first-sync-wins + self-referral block
    // do the rest. Returning users keep their original attribution (syncUser never overwrites).
    const refCode = await readRefCookie();
    const synced = await syncUser(user, refCode);

    // Optional name from the register form — set only if we don't already have one.
    const name = parsed.data.name?.trim();
    if (name && !existing?.name) {
      await prisma.user.update({ where: { id: synced.id }, data: { name } });
    }

    // Auto-enroll Lesson 0 (DR-030 §5). Best-effort — a hiccup must never fail the signup.
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

    // One-time /welcome for new accounts; returning users who've seen it go straight to the Hub.
    const seenWelcome = existing?.welcomeSeenAt ?? null;
    return { ok: true, redirectTo: seenWelcome ? "/dashboard" : "/welcome" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid OTP" };
  }
}
