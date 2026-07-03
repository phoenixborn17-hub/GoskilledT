// Checkout ADAPTER (Ticket 2, Task 4). OTP-inside-checkout (DR-023): phone identifies the
// buyer; the account is a by-product. This wires the validated checkout payload to Prisma +
// Razorpay. No money RULES here — GST split comes from the domain gst rule; price is the
// GST-inclusive package price (Golden Rule 12). Commissions are NOT touched here (Rule 2).
import { randomBytes } from "node:crypto";
import { prisma } from "../prisma";
import { gstFromInclusive } from "../../modules/payments/gst";
import { coursesToEnroll } from "../../modules/lms/entitlement";
import type { RzpOrderCreator } from "../razorpay";
import type { z } from "zod";
import type { checkoutStartSchema } from "../../modules/payments/schemas";

export type CheckoutInput = z.infer<typeof checkoutStartSchema>;

export interface CheckoutResult {
  orderId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: "INR";
}

function generateReferralCode(): string {
  return "GS" + randomBytes(4).toString("hex").toUpperCase(); // GS + 8 hex chars
}

/** Find-or-create the buyer by phone. Existing buyers keep their referral chain untouched. */
async function resolveBuyer(phone: string, referralCode?: string): Promise<{ id: string }> {
  const e164 = `+91${phone}`;
  const existing = await prisma.user.findUnique({ where: { phone: e164 }, select: { id: true } });
  if (existing) return existing;

  const referrer = referralCode
    ? await prisma.user.findUnique({ where: { referralCode }, select: { id: true } })
    : null;

  // Retry on the (astronomically unlikely) referralCode collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.user.create({
        data: { phone: e164, referralCode: generateReferralCode(), referredById: referrer?.id ?? null },
        select: { id: true },
      });
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  throw new Error("Failed to create buyer");
}

export async function startCheckout(
  input: CheckoutInput,
  createRzpOrder: RzpOrderCreator,
): Promise<CheckoutResult> {
  const pkg = await prisma.package.findUnique({
    where: { slug: input.packageSlug },
    include: { courses: { select: { courseId: true } } },
  });
  if (!pkg || !pkg.isActive) throw new Error(`Package not available: ${input.packageSlug}`);

  // Validate the buyer's course choice up-front for Skill Builder (DR-021) — same rule the
  // webhook enrollment uses, so a bad choice can never reach a paid order.
  const entitlement = coursesToEnroll(
    { slug: pkg.slug as CheckoutInput["packageSlug"], includesFutureCourses: pkg.includesFutureCourses, courseIds: pkg.courses.map((c) => c.courseId) },
    input.chosenCourseId,
  );
  if (!entitlement.ok) throw new Error(entitlement.reason);

  const buyer = await resolveBuyer(input.phone, input.referralCode);
  const gst = gstFromInclusive(pkg.priceInPaise, pkg.gstRateBps);

  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      packageId: pkg.id,
      amountInPaise: pkg.priceInPaise, // GST-inclusive display price
      gstInPaise: gst.gstInPaise,
      chosenCourseId: input.packageSlug === "skill-builder" ? input.chosenCourseId ?? null : null,
      status: "CREATED",
    },
    select: { id: true },
  });

  const rzpOrder = await createRzpOrder({ amountInPaise: pkg.priceInPaise, receipt: order.id });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzpOrder.id },
  });

  return { orderId: order.id, razorpayOrderId: rzpOrder.id, amountInPaise: pkg.priceInPaise, currency: "INR" };
}
