// Ticket 2, Task 5 — full money flow against a REAL Postgres (triggers + FKs live).
// Runs only when DATABASE_URL is set (point it at a disposable test DB). Every id is
// namespaced per run so it is safe to re-run against the append-only ledger.
//
//   checkout order → captured webhook (signed) → PAID + enrollments + 3 HELD commissions
//   → duplicate webhook (no change) → refund within window → clawbacks, available = 0
//   → withdrawal blocked (PAYOUTS_DISABLED)
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { startCheckout } from "@/lib/payments/checkout";
import { handleRazorpayWebhook } from "@/lib/payments/webhook";
import { availableBalanceOf, balanceOf } from "@/modules/ledger/ledger";
import { validateWithdrawal } from "@/modules/wallet/withdrawal";
import { payoutsEnabled } from "@/lib/env";

const HAS_DB = !!process.env.DATABASE_URL;
const WEBHOOK_SECRET = "whsec_integration_test";
const CB_PRICE = 219900; // Career Booster ₹2,199

const runId = `it${Date.now()}`;
function sign(rawBody: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

// Walk a fresh referral chain: buyer → a → b → c (3 uplines).
async function makeUser(tag: string, prefix: string, referredById: string | null): Promise<{ id: string; phone: string }> {
  const phone = `+91${prefix}${String(Date.now()).slice(-9)}`;
  const user = await prisma.user.create({
    data: { phone, referralCode: `${runId}${tag}`.toUpperCase(), referredById },
    select: { id: true },
  });
  return { id: user.id, phone };
}

describe.skipIf(!HAS_DB)("money flow (integration)", () => {
  let orderId: string;
  let razorpayOrderId: string;
  let buyerId: string;
  let uplineIds: string[]; // [L1 a, L2 b, L3 c] — commissions accrue HERE, not to the buyer
  let courseCount: number;
  const paymentId = `pay_${runId}`;

  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

    // Fixtures (idempotent — match the seed so a seeded DB is a no-op).
    const ai = await prisma.course.upsert({
      where: { slug: "ai-prompt-mastery" },
      update: {}, create: { slug: "ai-prompt-mastery", title: "AI Prompt Mastery", status: "PUBLISHED" },
      select: { id: true },
    });
    const dm = await prisma.course.upsert({
      where: { slug: "digital-marketing" },
      update: {}, create: { slug: "digital-marketing", title: "Digital Marketing", status: "COMING_SOON" },
      select: { id: true },
    });
    const cb = await prisma.package.upsert({
      where: { slug: "career-booster" },
      update: { priceInPaise: CB_PRICE, includesFutureCourses: true, isActive: true },
      create: { slug: "career-booster", name: "Career Booster", priceInPaise: CB_PRICE, includesFutureCourses: true, isActive: true },
      select: { id: true },
    });
    for (const courseId of [ai.id, dm.id]) {
      await prisma.packageCourse.upsert({
        where: { packageId_courseId: { packageId: cb.id, courseId } },
        update: {}, create: { packageId: cb.id, courseId },
      });
    }
    courseCount = 2;
    for (const type of ["REVENUE", "COMMISSION_PAYABLE", "PAYOUT_CLEARING", "GST_PAYABLE"] as const) {
      const exists = await prisma.ledgerAccount.findFirst({ where: { type, userId: null }, select: { id: true } });
      if (!exists) await prisma.ledgerAccount.create({ data: { type } });
    }

    // Referral chain c ← b ← a ← buyer.
    const c = await makeUser("c", "6", null);
    const b = await makeUser("b", "7", c.id);
    const a = await makeUser("a", "8", b.id);
    const buyer = await makeUser("buyer", "9", a.id);
    buyerId = buyer.id;
    uplineIds = [a.id, b.id, c.id];

    // Checkout: inject a fake Razorpay order creator (no network) — buyer already exists by phone.
    const buyerPhone10 = buyer.phone.replace("+91", "");
    const result = await startCheckout(
      { packageSlug: "career-booster", phone: buyerPhone10 },
      async () => ({ id: `order_rzp_${runId}` }),
    );
    orderId = result.orderId;
    razorpayOrderId = result.razorpayOrderId;
  });

  function capturedBody() {
    return JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, order_id: razorpayOrderId, amount: CB_PRICE, status: "captured" } } },
    });
  }

  it("captured webhook → PAID + enrollments + 3 HELD balanced commissions", async () => {
    const body = capturedBody();
    const res = await handleRazorpayWebhook(body, sign(body), `evt_capture_${runId}`);
    expect(res.status).toBe(200);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("PAID");
    expect(order.paidAt).not.toBeNull();
    expect(order.razorpayPaymentId).toBe(paymentId);

    const enrollments = await prisma.enrollment.findMany({ where: { userId: buyerId } });
    expect(enrollments.length).toBe(courseCount);

    const commissions = await prisma.ledgerTransaction.findMany({
      where: { type: "COMMISSION", refType: "Order", refId: orderId },
      include: { entries: true },
    });
    expect(commissions.length).toBe(3);
    for (const t of commissions) {
      expect(t.entries.reduce((s, e) => s + e.amountInPaise, 0)).toBe(0); // balanced
    }
    const walletCredits = commissions.flatMap((t) => t.entries.filter((e) => e.amountInPaise > 0).map((e) => e.amountInPaise));
    expect(walletCredits.sort((x, y) => y - x)).toEqual([125000, 25000, 15000]); // ₹1250/250/150

    // Commissions accrue to the UPLINES, all HELD (within the 48h window) → nothing available yet.
    const upline = await loadWalletEntries(uplineIds);
    expect(balanceOf(upline)).toBe(165000); // total held across L1+L2+L3 = ₹1650
    expect(availableBalanceOf(upline)).toBe(0);

    // The buyer earns nothing on their own purchase.
    expect(balanceOf(await loadWalletEntries([buyerId]))).toBe(0);
  });

  it("duplicate webhook → nothing changes (idempotent)", async () => {
    const body = capturedBody();
    const res = await handleRazorpayWebhook(body, sign(body), `evt_capture_${runId}`);
    expect(res.status).toBe(200);

    const commissions = await prisma.ledgerTransaction.count({ where: { type: "COMMISSION", refType: "Order", refId: orderId } });
    expect(commissions).toBe(3); // no double credit
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("PAID");
  });

  it("refund within window → clawbacks, available = 0, enrollments revoked", async () => {
    const body = JSON.stringify({
      event: "refund.processed",
      payload: { refund: { entity: { id: `rfnd_${runId}`, payment_id: paymentId, amount: CB_PRICE } } },
    });
    const res = await handleRazorpayWebhook(body, sign(body), `evt_refund_${runId}`);
    expect(res.status).toBe(200);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("REFUNDED");

    const clawbacks = await prisma.ledgerTransaction.count({ where: { type: "CLAWBACK", refType: "Order", refId: orderId } });
    expect(clawbacks).toBe(3);

    // Credit + clawback net every upline wallet to zero. Even AFTER the 48h hold expires,
    // the held credit and the clawback cancel — the commission never becomes withdrawable (DR-025).
    const upline = await loadWalletEntries(uplineIds);
    const afterWindow = new Date(Date.now() + 49 * 60 * 60 * 1000);
    expect(balanceOf(upline)).toBe(0);
    expect(availableBalanceOf(upline, afterWindow)).toBe(0);

    const enrollments = await prisma.enrollment.count({ where: { userId: buyerId } });
    expect(enrollments).toBe(0);
  });

  it("withdrawal blocked (PAYOUTS_DISABLED until D-01)", () => {
    const check = validateWithdrawal({
      payoutsEnabled: payoutsEnabled(), // false by default (D-01 gate)
      kycStatus: "APPROVED",
      hasPendingWithdrawal: false,
      availableInPaise: 0,
      amountInPaise: 50000,
    });
    expect(check.ok).toBe(false);
    expect(check.ok === false && check.code).toBe("PAYOUTS_DISABLED");
  });
});

async function loadWalletEntries(userIds: string[]): Promise<{ amountInPaise: number; holdUntil: Date | null }[]> {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { userId: { in: userIds } },
    include: { entries: { select: { amountInPaise: true, holdUntil: true } } },
  });
  return accounts.flatMap((a) => a.entries);
}
