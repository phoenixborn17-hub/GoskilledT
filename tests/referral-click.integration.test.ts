// Feature Batch v1.0 §3 — integration: 24h dedup window + the paid-vs-signup conversion metric.
// Conversion follows the REAL attribution graph (User.referredById), matching the documented
// precedent in lib/affiliate/referrals.ts — NOT the spec's illustrative Referral-table join, which
// the app never populates (see lib/affiliate/referral-click.ts header comment).
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  logReferralClick,
  getReferralConversionStats,
} from "@/lib/affiliate/referral-click";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);

describe.skipIf(!HAS_DB)("logReferralClick (24h dedup)", () => {
  const code = `RCDEDUP${runId}`;

  it("logs the first click for a (code, visitorId) pair", async () => {
    const r = await logReferralClick(code, "11111111-1111-4111-8111-111111111111");
    expect(r.logged).toBe(true);
  });

  it("dedupes a second click for the SAME (code, visitorId) within 24h", async () => {
    const r = await logReferralClick(code, "11111111-1111-4111-8111-111111111111");
    expect(r.logged).toBe(false);
  });

  it("does NOT dedupe a different visitorId for the same code", async () => {
    const r = await logReferralClick(code, "22222222-2222-4222-8222-222222222222");
    expect(r.logged).toBe(true);
  });

  it("logs again once the 24h window has passed", async () => {
    const past = new Date(Date.now() - 23 * 60 * 60 * 1000); // first click, 23h ago
    const visitorId = "33333333-3333-4333-8333-333333333333";
    await logReferralClick(code, visitorId, past);
    const now = new Date(past.getTime() + 25 * 60 * 60 * 1000); // +25h from the first click
    const r = await logReferralClick(code, visitorId, now);
    expect(r.logged).toBe(true);
  });
});

describe.skipIf(!HAS_DB)("getReferralConversionStats (paid-vs-signup)", () => {
  const code = `RCCONV${runId}`;
  let referrerId: string;

  beforeAll(async () => {
    const pkg = await prisma.package.upsert({
      where: { slug: "career-booster" },
      update: {},
      create: {
        slug: "career-booster",
        name: "Career Booster",
        priceInPaise: 219900,
        includesFutureCourses: true,
        isActive: true,
      },
      select: { id: true },
    });

    const referrer = await prisma.user.create({
      data: {
        supabaseId: `sb_rcconv_ref_${runId}`,
        phone: `+9198${runId}01`,
        referralCode: code,
      },
      select: { id: true },
    });
    referrerId = referrer.id;

    const paidDownline = await prisma.user.create({
      data: {
        supabaseId: `sb_rcconv_paid_${runId}`,
        phone: `+9198${runId}02`,
        referralCode: `RCCONVP${runId}`,
        referredById: referrerId,
      },
      select: { id: true },
    });
    const unpaidDownline = await prisma.user.create({
      data: {
        supabaseId: `sb_rcconv_free_${runId}`,
        phone: `+9198${runId}03`,
        referralCode: `RCCONVF${runId}`,
        referredById: referrerId,
      },
      select: { id: true },
    });

    await prisma.order.create({
      data: {
        userId: paidDownline.id,
        packageId: pkg.id,
        amountInPaise: 219900,
        status: "PAID",
      },
    });
    // A non-PAID order must NOT count as a conversion.
    await prisma.order.create({
      data: {
        userId: unpaidDownline.id,
        packageId: pkg.id,
        amountInPaise: 219900,
        status: "CREATED",
      },
    });

    // 3 clicks on this referrer's code.
    await prisma.referralClick.createMany({
      data: [
        { code, visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
        { code, visitorId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
        { code, visitorId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
      ],
    });
  });

  it("counts clicks, signups (2), and ONLY the PAID downline as a conversion (1)", async () => {
    const stats = await getReferralConversionStats(referrerId, code);
    expect(stats.clicks).toBe(3);
    expect(stats.signups).toBe(2);
    expect(stats.paidConversions).toBe(1);
    expect(stats.conversionRate).toBeCloseTo(1 / 3);
  });

  it("reports a null (not fabricated-zero) conversion rate when there are no clicks", async () => {
    const stats = await getReferralConversionStats(
      referrerId,
      `RCNOCLICKS${runId}`,
    );
    expect(stats.clicks).toBe(0);
    expect(stats.conversionRate).toBeNull();
  });
});
