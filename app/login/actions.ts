// Login server actions for returning users (Ticket 3, Task 3). Same Supabase OTP as checkout,
// without creating an order. On verify we sync the internal User and let the client redirect.
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import { checkOtpSendRate } from "../../lib/auth/otp-rate-limit";
import { syncUser } from "../../lib/auth/user-sync";

export type LoginResult = { ok: true } | { ok: false; error: string };

const sendSchema = z.object({ phone: phoneSchema });
const verifyLoginSchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the OTP"),
});

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

export async function verifyLoginOtp(
  input: z.input<typeof verifyLoginSchema>,
): Promise<LoginResult> {
  const parsed = verifyLoginSchema.safeParse(input);
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
    await syncUser(user);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid OTP" };
  }
}
