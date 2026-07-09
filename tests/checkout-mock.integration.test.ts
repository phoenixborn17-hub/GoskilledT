// Ticket 3, Task 6 — e2e development flow with the MOCK payment provider:
//   authenticated buyer (post-OTP) → mock order (mock_order_) → signed webhook via the
//   dev simulator helper → the REAL webhook handler → PAID + enrollments + 3 HELD
//   commissions to uplines + balanced ledger. Same pipeline production will run.
//
// The Supabase OTP step itself needs live Supabase creds + test numbers, so here we enter at
// the post-verify state (a synced buyer). The signed-webhook → ledger half is fully exercised.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { startCheckout as placeOrder } from "@/lib/payments/checkout";
import { getPaymentProvider } from "@/lib/payments/provider";
import { buildSignedCapture } from "@/lib/payments/dev-webhook";
import { handleRazorpayWebhook } from "@/lib/payments/webhook";
import { availableBalanceOf, balanceOf } from "@/modules/ledger/ledger";

const HAS_DB = !!process.env.DATABASE_URL;
const CB_PRICE = 219900;
const runId = `t3${Date.now()}`;

async function makeUser(
  prefix: string,
  referredById: string | null,
): Promise<{ id: string; phone: string }> {
  const phone = `+91${prefix}${String(Date.now()).slice(-9)}`;
  const u = await prisma.user.create({
    data: {
      phone,
      referralCode: `${runId}${prefix}`.toUpperCase(),
      referredById,
    },
    select: { id: true },
  });
  return { id: u.id, phone };
}

describe.skipIf(!HAS_DB)("checkout with mock provider (e2e dev flow)", () => {
  let buyerPhone10: string;
  let uplineIds: string[];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_dev_local_mock";

  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    process.env.PAYMENT_PROVIDER = "mock";

    const ai = await prisma.course.upsert({
      where: { slug: "ai-prompt-mastery" },
      update: {},
      create: {
        slug: "ai-prompt-mastery",
        title: "AI Prompt Mastery",
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    const dm = await prisma.course.upsert({
      where: { slug: "digital-marketing" },
      update: {},
      create: {
        slug: "digital-marketing",
        title: "Digital Marketing",
        status: "COMING_SOON",
      },
      select: { id: true },
    });
    const cb = await prisma.package.upsert({
      where: { slug: "career-booster" },
      update: {
        priceInPaise: CB_PRICE,
        includesFutureCourses: true,
        isActive: true,
      },
      create: {
        slug: "career-booster",
        name: "Career Booster",
        priceInPaise: CB_PRICE,
        includesFutureCourses: true,
        isActive: true,
      },
      select: { id: true },
    });
    for (const courseId of [ai.id, dm.id]) {
      await prisma.packageCourse.upsert({
        where: { packageId_courseId: { packageId: cb.id, courseId } },
        update: {},
        create: { packageId: cb.id, courseId },
      });
    }
    for (const type of [
      "REVENUE",
      "COMMISSION_PAYABLE",
      "PAYOUT_CLEARING",
      "GST_PAYABLE",
    ] as const) {
      const exists = await prisma.ledgerAccount.findFirst({
        where: { type, userId: null },
        select: { id: true },
      });
      if (!exists) await prisma.ledgerAccount.create({ data: { type } });
    }

    // Referral chain c ← b ← a ← buyer (buyer already exists → simulates a synced, authenticated user).
    const c = await makeUser("6", null);
    const b = await makeUser("7", c.id);
    const a = await makeUser("8", b.id);
    const buyer = await makeUser("9", a.id);
    buyerPhone10 = buyer.phone.replace("+91", "");
    uplineIds = [a.id, b.id, c.id];

    // DR-038 earning gate (Phase B/B1): uplines earn only with their OWN confirmed (PAID) purchase.
    // Seed one for each so this dev-flow exercises the eligible path (assertions unchanged).
    for (const uid of uplineIds) {
      await prisma.order.create({
        data: {
          userId: uid,
          packageId: cb.id,
          amountInPaise: CB_PRICE,
          status: "PAID",
        },
      });
    }
  });

  it("mock order → signed webhook → PAID + enrollments + 3 HELD commissions", async () => {
    const provider = getPaymentProvider();
    expect(provider.name).toBe("mock");

    const order = await placeOrder(
      { packageSlug: "career-booster", phone: buyerPhone10 },
      (i) => provider.createOrder(i),
    );
    expect(order.razorpayOrderId).toMatch(/^mock_order_[0-9a-f]{20}$/);
    expect(order.amountInPaise).toBe(CB_PRICE);

    const signed = buildSignedCapture({
      razorpayOrderId: order.razorpayOrderId,
      amountInPaise: order.amountInPaise,
      webhookSecret: secret,
    });
    expect(signed.paymentId).toMatch(/^mock_pay_/);

    const res = await handleRazorpayWebhook(
      signed.body,
      signed.signature,
      signed.eventId,
    );
    expect(res.status).toBe(200);

    const paid = await prisma.order.findUniqueOrThrow({
      where: { id: order.orderId },
    });
    expect(paid.status).toBe("PAID");
    expect(paid.razorpayPaymentId).toBe(signed.paymentId);

    const buyer = await prisma.user.findFirstOrThrow({
      where: { phone: `+91${buyerPhone10}` },
      select: { id: true },
    });
    expect(await prisma.enrollment.count({ where: { userId: buyer.id } })).toBe(
      2,
    );

    const commissions = await prisma.ledgerTransaction.findMany({
      where: { type: "COMMISSION", refType: "Order", refId: order.orderId },
      include: { entries: true },
    });
    expect(commissions.length).toBe(3);
    for (const t of commissions)
      expect(t.entries.reduce((s, e) => s + e.amountInPaise, 0)).toBe(0);

    const upline = await loadWalletEntries(uplineIds);
    expect(balanceOf(upline)).toBe(165000); // ₹1650 held across L1+L2+L3
    expect(availableBalanceOf(upline)).toBe(0); // all HELD within window
  });

  it("simulator is idempotent — re-sending the same event changes nothing", async () => {
    const provider = getPaymentProvider();
    const order = await placeOrder(
      { packageSlug: "career-booster", phone: buyerPhone10 },
      (i) => provider.createOrder(i),
    );
    const signed = buildSignedCapture({
      razorpayOrderId: order.razorpayOrderId,
      amountInPaise: order.amountInPaise,
      webhookSecret: secret,
    });

    const first = await handleRazorpayWebhook(
      signed.body,
      signed.signature,
      signed.eventId,
    );
    const second = await handleRazorpayWebhook(
      signed.body,
      signed.signature,
      signed.eventId,
    );
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(
      await prisma.ledgerTransaction.count({
        where: { type: "COMMISSION", refType: "Order", refId: order.orderId },
      }),
    ).toBe(3);
  });
});

async function loadWalletEntries(
  userIds: string[],
): Promise<{ amountInPaise: number; holdUntil: Date | null }[]> {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { userId: { in: userIds } },
    include: { entries: { select: { amountInPaise: true, holdUntil: true } } },
  });
  return accounts.flatMap((a) => a.entries);
}
