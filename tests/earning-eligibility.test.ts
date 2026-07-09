// Phase A (DR-038) — the earning gate. A referral link/registration ALONE never earns; an affiliate
// earns on a downline purchase ONLY with their OWN confirmed (PAID) purchase. Pure rule + DB adapter.
// This is acceptance test §8.9: a sponsor with no confirmed purchase is NOT eligible to earn.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { canEarnCommission } from "@/modules/affiliate/eligibility";
import {
  hasConfirmedPurchase,
  isEligibleToEarn,
} from "@/lib/affiliate/eligibility";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);

describe("canEarnCommission (pure DR-038 rule)", () => {
  it("earns ONLY with an own confirmed purchase", () => {
    expect(canEarnCommission({ hasOwnConfirmedPurchase: false })).toBe(false);
    expect(canEarnCommission({ hasOwnConfirmedPurchase: true })).toBe(true);
  });
});

describe.skipIf(!HAS_DB)("earning eligibility (integration §8.9)", () => {
  let pkgId: string;
  let sponsorNoPurchase: string;
  let sponsorPaid: string;

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
    pkgId = pkg.id;

    const a = await prisma.user.create({
      data: {
        supabaseId: `sb_elig_a_${runId}`,
        phone: `+9197${runId}01`,
        referralCode: `GSELIGA${runId}`,
      },
      select: { id: true },
    });
    const b = await prisma.user.create({
      data: {
        supabaseId: `sb_elig_b_${runId}`,
        phone: `+9197${runId}02`,
        referralCode: `GSELIGB${runId}`,
      },
      select: { id: true },
    });
    sponsorNoPurchase = a.id;
    sponsorPaid = b.id;

    // Sponsor B completes their OWN purchase (PAID). Sponsor A never buys.
    await prisma.order.create({
      data: {
        userId: sponsorPaid,
        packageId: pkgId,
        amountInPaise: 219900,
        status: "PAID",
      },
    });
    // A non-PAID order for A must NOT count as a confirmed purchase.
    await prisma.order.create({
      data: {
        userId: sponsorNoPurchase,
        packageId: pkgId,
        amountInPaise: 219900,
        status: "CREATED",
      },
    });
  });

  it("a sponsor with NO confirmed purchase is not eligible to earn", async () => {
    expect(await hasConfirmedPurchase(sponsorNoPurchase)).toBe(false);
    expect(await isEligibleToEarn(sponsorNoPurchase)).toBe(false);
  });

  it("a sponsor WITH a confirmed (PAID) purchase is eligible to earn", async () => {
    expect(await hasConfirmedPurchase(sponsorPaid)).toBe(true);
    expect(await isEligibleToEarn(sponsorPaid)).toBe(true);
  });
});
