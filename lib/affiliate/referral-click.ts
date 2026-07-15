// Referral click logging + conversion stats (Feature Batch v1.0 §3). Click-log is purely additive
// (no money path); the conversion metric is a READ-ONLY join, never a new commission trigger.
//
// NOTE on attribution source: the spec's illustrative schema references a `Referral → Order` join,
// but the app's REAL, populated attribution graph is `User.referredById` (documented deviation in
// lib/affiliate/referrals.ts — the `Referral` table isn't populated by the app; reading it would
// report a false "0 signups"). This module follows that same, already-established precedent: signup
// attribution = `User.referredById`, paid conversion = a signup whose OWN Order reached PAID.
import { prisma } from "../prisma";

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface LogClickResult {
  logged: boolean; // false = deduped (a click for this code+visitor already landed within 24h)
}

/** Log a referral click, deduped by (code, visitorId) within a rolling 24h window. */
export async function logReferralClick(
  code: string,
  visitorId: string,
  now: Date = new Date(),
): Promise<LogClickResult> {
  const since = new Date(now.getTime() - DEDUP_WINDOW_MS);
  const existing = await prisma.referralClick.findFirst({
    where: { code, visitorId, createdAt: { gte: since } },
    select: { id: true },
  });
  if (existing) return { logged: false };

  await prisma.referralClick.create({ data: { code, visitorId, createdAt: now } });
  return { logged: true };
}

export interface ReferralConversionStats {
  clicks: number;
  signups: number;
  paidConversions: number;
  /** 0–1, or null when there are no clicks to compute a rate from (honest — never a fabricated 0%). */
  conversionRate: number | null;
}

/** Clicks on `code` + signups/paid-conversions attributed to `userId` via the real referral graph. */
export async function getReferralConversionStats(
  userId: string,
  code: string,
): Promise<ReferralConversionStats> {
  const [clicks, downline] = await Promise.all([
    prisma.referralClick.count({ where: { code } }),
    prisma.user.findMany({
      where: { referredById: userId },
      select: { id: true },
    }),
  ]);

  const signups = downline.length;
  const paidConversions = signups
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: {
          userId: { in: downline.map((u) => u.id) },
          status: "PAID",
        },
      }).then((rows) => rows.length)
    : 0;

  return {
    clicks,
    signups,
    paidConversions,
    conversionRate: clicks > 0 ? paidConversions / clicks : null,
  };
}
