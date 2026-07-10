// Unit 3 (§2.5) — DR-038 refund-mirror edge (Phase B). When an upline EARNS a commission on a
// downline's purchase and then their OWN purchase is refunded:
//   • the ALREADY-EARNED commission is KEPT (clawback is keyed to the refunded order, which had no
//     commission to the upline — eligibility is evaluated at credit-time, no retroactive removal), and
//   • FUTURE eligibility is LOST (hasConfirmedPurchase → false), so the next downline purchase does
//     NOT credit them.
// Drives the REAL webhook — no money logic changed; a pure non-regression + edge assertion.
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { startCheckout } from "@/lib/payments/checkout";
import { handleRazorpayWebhook } from "@/lib/payments/webhook";
import { hasConfirmedPurchase } from "@/lib/affiliate/eligibility";

const HAS_DB = !!process.env.DATABASE_URL;
const SECRET = "whsec_refund_mirror_test";
const CB_PRICE = 219900;
const CB_L1 = 125000; // career-booster L1 commission (paise)

const runId = `rm${Date.now()}`;
let seq = 0;
const nextId = () => `${runId}${seq++}`;
const sign = (b: string) =>
  createHmac("sha256", SECRET).update(b).digest("hex");
const uniquePhone = () =>
  `+91${9_000_000_000 + ((Number(String(Date.now()).slice(-9)) + seq) % 1_000_000_000)}`;

async function mkUser(
  referredById: string | null,
): Promise<{ id: string; phone: string }> {
  const phone = uniquePhone();
  const u = await prisma.user.create({
    data: { phone, referralCode: `GRM${nextId()}`.toUpperCase(), referredById },
    select: { id: true },
  });
  return { id: u.id, phone };
}

function capturedBody(razorpayOrderId: string, paymentId: string) {
  return JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: CB_PRICE,
          status: "captured",
        },
      },
    },
  });
}

/** Buy career-booster as `phone10`, capture the webhook → PAID. Returns ids. */
async function buyAndCapture(
  phone10: string,
): Promise<{ orderId: string; paymentId: string }> {
  const tag = nextId();
  const order = await startCheckout(
    { packageSlug: "career-booster", phone: phone10 },
    async () => ({ id: `order_rzp_${tag}` }),
  );
  const paymentId = `pay_${tag}`;
  const body = capturedBody(order.razorpayOrderId, paymentId);
  const res = await handleRazorpayWebhook(body, sign(body), `evt_${tag}`);
  expect(res.status).toBe(200);
  return { orderId: order.orderId, paymentId };
}

async function commissionToUser(
  orderId: string,
  userId: string,
): Promise<number> {
  const txns = await prisma.ledgerTransaction.findMany({
    where: { type: "COMMISSION", refType: "Order", refId: orderId },
    include: {
      entries: {
        include: { account: { select: { userId: true, type: true } } },
      },
    },
  });
  let sum = 0;
  for (const t of txns)
    for (const e of t.entries)
      if (
        e.amountInPaise > 0 &&
        e.account.type === "USER_WALLET" &&
        e.account.userId === userId
      )
        sum += e.amountInPaise;
  return sum;
}

describe.skipIf(!HAS_DB)("DR-038 refund-mirror edge (Unit 3 §2.5)", () => {
  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
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
    for (const courseId of [ai.id, dm.id])
      await prisma.packageCourse.upsert({
        where: { packageId_courseId: { packageId: cb.id, courseId } },
        update: {},
        create: { packageId: cb.id, courseId },
      });
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
  });

  it("earned commission is KEPT after the upline's own order refunds; future eligibility is LOST", async () => {
    // U buys (own purchase → eligible). U has no upline, so this credits nobody.
    const upline = await mkUser(null);
    const uOrder = await buyAndCapture(upline.phone.replace("+91", ""));
    expect(await hasConfirmedPurchase(upline.id)).toBe(true);

    // Downline D1 (referred by U) buys → U is eligible at credit-time → U earns L1.
    const d1 = await mkUser(upline.id);
    const d1Order = await buyAndCapture(d1.phone.replace("+91", ""));
    expect(await commissionToUser(d1Order.orderId, upline.id)).toBe(CB_L1);

    // U's OWN order is refunded. Clawback is keyed to U's order (which paid U nothing).
    const refundBody = JSON.stringify({
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            id: `rfnd_${nextId()}`,
            payment_id: uOrder.paymentId,
            amount: CB_PRICE,
          },
        },
      },
    });
    const rf = await handleRazorpayWebhook(
      refundBody,
      sign(refundBody),
      `evt_rf_${nextId()}`,
    );
    expect(rf.status).toBe(200);
    expect(
      (
        await prisma.order.findUniqueOrThrow({
          where: { id: uOrder.orderId },
          select: { status: true },
        })
      ).status,
    ).toBe("REFUNDED");

    // KEPT: U's commission from D1's order is untouched by refunding U's OWN order.
    expect(await commissionToUser(d1Order.orderId, upline.id)).toBe(CB_L1);

    // LOST: U now has no confirmed purchase → future downline purchase does NOT credit U.
    expect(await hasConfirmedPurchase(upline.id)).toBe(false);
    const d2 = await mkUser(upline.id);
    const d2Order = await buyAndCapture(d2.phone.replace("+91", ""));
    expect(await commissionToUser(d2Order.orderId, upline.id)).toBe(0);
  });
});
