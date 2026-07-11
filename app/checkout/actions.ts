// OTP-inside-checkout server actions (Ticket 3, Task 3 · DR-023).
//   startCheckout(phone, package[, course][, ref])  → Supabase OTP sent
//   verifyCheckoutOtp(...)                           → session + User upsert + Order + payment order
// Reuses the Ticket 2 order-placement flow unchanged: after syncUser the buyer already exists
// by phone, so lib/payments/checkout.startCheckout's resolveBuyer finds them.
"use server";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { getOtpProvider } from "../../lib/auth/otp";
import {
  checkOtpSendRate,
  checkOtpVerifyRate,
} from "../../lib/auth/otp-rate-limit";
import { syncUser } from "../../lib/auth/user-sync";
import { resolveSponsorByCode } from "../../lib/auth/sponsor";
import { startCheckout as placeOrder } from "../../lib/payments/checkout";
import { getPaymentProvider } from "../../lib/payments/provider";
import { track, anonId } from "../../lib/analytics/track";

// Invite-only (DR-036/DR-038): a VALID referral code is MANDATORY before payment, in checkout too.
// It usually arrives pre-filled from the affiliate's ?ref= link, so manual pre-pay inputs stay ≤3
// (phone, OTP, + course for Skill Builder). Password is deferred to /onboarding to keep the Razorpay
// step stable (§4.2). The money/webhook/ledger path is unchanged — enforcement lives in this adapter.
const INVALID_CODE = "Enter a valid referral code to continue";

const startSchema = z
  .object({
    phone: phoneSchema,
    packageSlug: z.enum(["skill-builder", "career-booster"]),
    chosenCourseId: z.string().min(1).optional(),
    referralCode: z.string().trim().toUpperCase().min(3, INVALID_CODE),
  })
  .superRefine((v, ctx) => {
    if (v.packageSlug === "skill-builder" && !v.chosenCourseId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["chosenCourseId"],
        message: "Choose your course (Skill Builder includes 1 course)",
      });
  });

const verifySchema = z.object({
  phone: phoneSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the OTP"),
  packageSlug: z.enum(["skill-builder", "career-booster"]),
  chosenCourseId: z.string().min(1).optional(),
  referralCode: z.string().trim().toUpperCase().min(3, INVALID_CODE),
});

export type CheckoutActionResult = { ok: true } | { ok: false; error: string };

export type VerifyCheckoutResult =
  | {
      ok: true;
      orderId: string;
      paymentOrderId: string;
      amountInPaise: number;
      provider: string;
    }
  | { ok: false; error: string };

export async function startCheckout(
  input: z.input<typeof startSchema>,
): Promise<CheckoutActionResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  // Mandatory referral gate — a valid code (real sponsor) is required before we send an OTP or pay.
  const sponsor = await resolveSponsorByCode(parsed.data.referralCode);
  if (!sponsor) return { ok: false, error: INVALID_CODE };
  const id = anonId(parsed.data.phone);
  await track("begin_checkout", id, { package: parsed.data.packageSlug });
  const rl = await checkOtpSendRate(parsed.data.phone);
  if (!rl.ok) return { ok: false, error: rl.error };
  try {
    await getOtpProvider().sendOtp(parsed.data.phone);
    await track("checkout_otp_sent", id, { package: parsed.data.packageSlug });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send OTP",
    };
  }
}

export async function verifyCheckoutOtp(
  input: z.input<typeof verifySchema>,
): Promise<VerifyCheckoutResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  const data = parsed.data;

  // Re-validate the mandatory code server-side (defence in depth — never trust the client).
  const sponsor = await resolveSponsorByCode(data.referralCode);
  if (!sponsor) return { ok: false, error: INVALID_CODE };

  const rl = await checkOtpVerifyRate(data.phone); // A-2
  if (!rl.ok) return { ok: false, error: rl.error };

  try {
    // 1) Verify OTP → authenticated Supabase session (cookies set by the server client).
    const { user } = await getOtpProvider().verifyOtp(data.phone, data.token);
    // 2) Sync our internal User (attribution from the mandatory referral code).
    await syncUser(user, data.referralCode);
    // 3) Create Order + payment-provider order (mock or razorpay) via the Ticket 2 flow.
    const provider = getPaymentProvider();
    const order = await placeOrder(
      {
        packageSlug: data.packageSlug,
        chosenCourseId: data.chosenCourseId,
        phone: data.phone,
        referralCode: data.referralCode,
      },
      (i) => provider.createOrder(i),
    );
    // Funnel: OTP verified + order created. distinctId = our user id so this stitches to the
    // webhook `purchase` event. Amount is not PII; never send phone/name here.
    await track("checkout_verified", user.id, {
      package: data.packageSlug,
      order_id: order.orderId,
      amount_paise: order.amountInPaise,
    });
    return {
      ok: true,
      orderId: order.orderId,
      paymentOrderId: order.razorpayOrderId,
      amountInPaise: order.amountInPaise,
      provider: provider.name,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Checkout failed",
    };
  }
}
