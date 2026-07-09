// Phase B / B1 (Tier-A) — DR-038 earning gate ACTIVATED in the commission-credit path.
// Drives the REAL webhook handler end-to-end (signed capture → PAID → commissions) against live
// Postgres, asserting who gets credited under the gate:
//   • eligible upline (own PAID purchase) → credited
//   • ineligible upline (no purchase) → NOT credited, and NO roll-up
//   • mixed chain (L1 eligible, L2 not, L3 eligible) → only L1 + L3, each at its OWN level amount
//   • refund → clawback still correct for the credited (eligible) commissions
//   • duplicate delivery → idempotent (no double credit)
// Idempotency, HELD lifecycle (DR-025), clawback and DR-007 amounts are unchanged — only WHO earns.
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { startCheckout } from "@/lib/payments/checkout";
import { handleRazorpayWebhook } from "@/lib/payments/webhook";
import { balanceOf, availableBalanceOf } from "@/modules/ledger/ledger";

const HAS_DB = !!process.env.DATABASE_URL;
const SECRET = "whsec_b1_gate_test";
const CB_PRICE = 219900; // Career Booster ₹2,199
const CB = { 1: 125000, 2: 25000, 3: 15000 }; // DR-007 career-booster L1/L2/L3 (paise)

const runId = `b1${Date.now()}`;
let seq = 0;
function nextId(): string {
  return `${runId}${seq++}`;
}
function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}
function uniquePhone(): string {
  const base = Number(String(Date.now()).slice(-9));
  return `+91${9_000_000_000 + ((base + seq) % 1_000_000_000)}`;
}

async function mkUser(referredById: string | null): Promise<{ id: string; phone: string }> {
  const phone = uniquePhone();
  const u = await prisma.user.create({
    data: {
      phone,
      referralCode: `GB${nextId()}`.toUpperCase(),
      referredById,
    },
    select: { id: true },
  });
  return { id: u.id, phone };
}

let cbPackageId: string;
async function giveOwnPurchase(userId: string): Promise<void> {
  await prisma.order.create({
    data: { userId, packageId: cbPackageId, amountInPaise: CB_PRICE, status: "PAID" },
  });
}

/** Build buyer ← a(L1) ← b(L2) ← c(L3); seed own purchases per `eligible`; capture the buyer's order. */
async function runScenario(eligible: [boolean, boolean, boolean]): Promise<{
  orderId: string;
  razorpayOrderId: string;
  paymentId: string;
  byLevel: { 1: string; 2: string; 3: string };
}> {
  const c = await mkUser(null); // L3
  const b = await mkUser(c.id); // L2
  const a = await mkUser(b.id); // L1
  const buyer = await mkUser(a.id);
  const byLevel = { 1: a.id, 2: b.id, 3: c.id } as const;
  if (eligible[0]) await giveOwnPurchase(a.id);
  if (eligible[1]) await giveOwnPurchase(b.id);
  if (eligible[2]) await giveOwnPurchase(c.id);

  const tag = nextId();
  const result = await startCheckout(
    { packageSlug: "career-booster", phone: buyer.phone.replace("+91", "") },
    async () => ({ id: `order_rzp_${tag}` }),
  );
  const paymentId = `pay_${tag}`;
  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: result.razorpayOrderId,
          amount: CB_PRICE,
          status: "captured",
        },
      },
    },
  });
  const res = await handleRazorpayWebhook(body, sign(body), `evt_${tag}`);
  expect(res.status).toBe(200);
  return { orderId: result.orderId, razorpayOrderId: result.razorpayOrderId, paymentId, byLevel };
}

/** Map of userId → credited wallet amount (paise) for an order's COMMISSION transactions. */
async function creditedByUser(orderId: string): Promise<Map<string, number>> {
  const txns = await prisma.ledgerTransaction.findMany({
    where: { type: "COMMISSION", refType: "Order", refId: orderId },
    include: { entries: { include: { account: { select: { userId: true, type: true } } } } },
  });
  const m = new Map<string, number>();
  for (const t of txns)
    for (const e of t.entries)
      if (e.amountInPaise > 0 && e.account.type === "USER_WALLET" && e.account.userId)
        m.set(e.account.userId, e.amountInPaise);
  return m;
}

async function walletEntries(userIds: string[]) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { userId: { in: userIds } },
    include: { entries: { select: { amountInPaise: true, holdUntil: true } } },
  });
  return accounts.flatMap((a) => a.entries);
}

describe.skipIf(!HAS_DB)("DR-038 earning gate in the webhook (B1, Tier-A)", () => {
  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
    process.env.PAYMENT_PROVIDER = "mock";
    const ai = await prisma.course.upsert({
      where: { slug: "ai-prompt-mastery" },
      update: {},
      create: { slug: "ai-prompt-mastery", title: "AI Prompt Mastery", status: "PUBLISHED" },
      select: { id: true },
    });
    const dm = await prisma.course.upsert({
      where: { slug: "digital-marketing" },
      update: {},
      create: { slug: "digital-marketing", title: "Digital Marketing", status: "COMING_SOON" },
      select: { id: true },
    });
    const cb = await prisma.package.upsert({
      where: { slug: "career-booster" },
      update: { priceInPaise: CB_PRICE, includesFutureCourses: true, isActive: true },
      create: {
        slug: "career-booster",
        name: "Career Booster",
        priceInPaise: CB_PRICE,
        includesFutureCourses: true,
        isActive: true,
      },
      select: { id: true },
    });
    cbPackageId = cb.id;
    for (const courseId of [ai.id, dm.id])
      await prisma.packageCourse.upsert({
        where: { packageId_courseId: { packageId: cb.id, courseId } },
        update: {},
        create: { packageId: cb.id, courseId },
      });
    for (const type of ["REVENUE", "COMMISSION_PAYABLE", "PAYOUT_CLEARING", "GST_PAYABLE"] as const) {
      const exists = await prisma.ledgerAccount.findFirst({ where: { type, userId: null }, select: { id: true } });
      if (!exists) await prisma.ledgerAccount.create({ data: { type } });
    }
  });

  it("eligible upline (own PAID purchase) IS credited; ineligible uplines are not", async () => {
    const { orderId, byLevel } = await runScenario([true, false, false]);
    const credited = await creditedByUser(orderId);
    expect(credited.size).toBe(1);
    expect(credited.get(byLevel[1])).toBe(CB[1]); // L1 eligible → ₹1250
    expect(credited.has(byLevel[2])).toBe(false);
    expect(credited.has(byLevel[3])).toBe(false);
  });

  it("ineligible chain (no upline has purchased) → ZERO commissions, no roll-up", async () => {
    const { orderId } = await runScenario([false, false, false]);
    const credited = await creditedByUser(orderId);
    expect(credited.size).toBe(0);
    const count = await prisma.ledgerTransaction.count({
      where: { type: "COMMISSION", refType: "Order", refId: orderId },
    });
    expect(count).toBe(0);
  });

  it("mixed chain (L1 eligible, L2 not, L3 eligible) → credits ONLY L1 + L3 at their own levels (no roll-up)", async () => {
    const { orderId, byLevel } = await runScenario([true, false, true]);
    const credited = await creditedByUser(orderId);
    expect(credited.size).toBe(2);
    expect(credited.get(byLevel[1])).toBe(CB[1]); // ₹1250 (L1)
    expect(credited.has(byLevel[2])).toBe(false); // L2 skipped
    // No roll-up: L3 keeps the L3 amount (₹150), it is NOT promoted to the skipped L2 amount (₹250).
    expect(credited.get(byLevel[3])).toBe(CB[3]);
  });

  it("refund → clawback reverses the eligible commissions; wallets net to zero even after the hold", async () => {
    const { orderId, paymentId, byLevel } = await runScenario([true, true, true]);
    expect((await creditedByUser(orderId)).size).toBe(3);

    const body = JSON.stringify({
      event: "refund.processed",
      payload: { refund: { entity: { id: `rfnd_${orderId}`, payment_id: paymentId, amount: CB_PRICE } } },
    });
    const res = await handleRazorpayWebhook(body, sign(body), `evt_rfnd_${orderId}`);
    expect(res.status).toBe(200);

    const clawbacks = await prisma.ledgerTransaction.count({
      where: { type: "CLAWBACK", refType: "Order", refId: orderId },
    });
    expect(clawbacks).toBe(3);
    const entries = await walletEntries([byLevel[1], byLevel[2], byLevel[3]]);
    const afterWindow = new Date(Date.now() + 49 * 60 * 60 * 1000);
    expect(balanceOf(entries)).toBe(0);
    expect(availableBalanceOf(entries, afterWindow)).toBe(0);
  });

  it("duplicate delivery is idempotent — the eligible credits are not doubled", async () => {
    const { orderId, razorpayOrderId, paymentId } = await runScenario([true, false, true]);
    const before = (await creditedByUser(orderId)).size;
    expect(before).toBe(2);
    const body = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: paymentId, order_id: razorpayOrderId, amount: CB_PRICE, status: "captured" } },
      },
    });
    // Re-deliver the SAME event id → idempotent no-op.
    const res = await handleRazorpayWebhook(body, sign(body), `evt_dup_${orderId}`);
    expect(res.status).toBe(200);
    const count = await prisma.ledgerTransaction.count({
      where: { type: "COMMISSION", refType: "Order", refId: orderId },
    });
    expect(count).toBe(2); // still only the 2 eligible credits
  });
});
