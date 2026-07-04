// Login server actions for returning users (Ticket 3, Task 3). Same Supabase OTP as checkout,
// without creating an order. On verify we sync the internal User and let the client redirect.
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import { syncUser } from "../../lib/auth/user-sync";
import { readRefCookie } from "../../lib/auth/ref-cookie";

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
    // First-touch ref capture also applies at /login (DR-030 §2): a genuinely new user who lands
    // here with ?ref= is attributed; returning users keep their original upline (syncUser never
    // overwrites an existing attribution).
    await syncUser(user, await readRefCookie());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid OTP" };
  }
}
