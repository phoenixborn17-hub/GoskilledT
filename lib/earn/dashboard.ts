// Earn workspace dashboard — composite loader (Redesign U5 · Dashboard §4). DISPLAY-ONLY: composes
// EXISTING reads (eligibility, referral tree, wallet ledger summary, KYC status, payout flag, graph
// series). NO money recompute, NO re-gate — every money value comes straight from the leak-tested
// ledger helpers. Payouts stay OFF (D-01); the page renders honest, never a fake "Paid".
import { startOfMonth } from "date-fns";
import { payoutsEnabled } from "../env";
import { siteUrl } from "../seo";
import { isEligibleToEarn } from "../affiliate/eligibility";
import { getReferralTree } from "../affiliate/referrals";
import { getWalletSummaryFor } from "../wallet/queries";
import { getKycStatus } from "../kyc/queries";
import {
  getEarningSeriesData,
  getPaymentsReceivedData,
} from "../affiliate/graph-queries";
import { sumByBucket } from "../affiliate/analytics";

export type KycStatus = Awaited<ReturnType<typeof getKycStatus>>;

export interface EarnDashboard {
  /** DR-038: has the user made their OWN confirmed purchase (earning-eligible)? */
  eligible: boolean;
  /** Payout gate (D-01). Currently OFF — surfaces show honest status, never a fake "Paid". */
  payoutsOpen: boolean;
  referralCode: string;
  shareUrl: string;
  tree: {
    l1Count: number;
    l2Count: number;
    l3Count: number;
    thisMonth: number;
  };
  wallet: {
    availableInPaise: number;
    heldInPaise: number;
    totalInPaise: number;
  };
  kycStatus: KycStatus;
  earningSeries: ReturnType<typeof sumByBucket>;
  paymentsSeries: ReturnType<typeof sumByBucket>;
}

export async function getEarnDashboard(
  userId: string,
  referralCode: string,
): Promise<EarnDashboard> {
  const [eligible, tree, wallet, kycStatus, earningData, paymentsData] =
    await Promise.all([
      isEligibleToEarn(userId),
      getReferralTree(userId),
      getWalletSummaryFor(userId),
      getKycStatus(userId),
      getEarningSeriesData(userId),
      getPaymentsReceivedData(userId),
    ]);

  const monthStart = startOfMonth(new Date());
  const thisMonth = tree.l1.filter((p) => p.joinedAt >= monthStart).length;

  return {
    eligible,
    payoutsOpen: payoutsEnabled(),
    referralCode,
    shareUrl: `${siteUrl()}/register?ref=${referralCode}`,
    tree: {
      l1Count: tree.l1Count,
      l2Count: tree.l2Count,
      l3Count: tree.l3Count,
      thisMonth,
    },
    wallet: {
      availableInPaise: wallet.availableInPaise,
      heldInPaise: wallet.heldInPaise,
      totalInPaise: wallet.totalInPaise,
    },
    kycStatus,
    earningSeries: sumByBucket(earningData, "month"),
    paymentsSeries: sumByBucket(paymentsData, "month"),
  };
}

/** Honest commission range (DR-007 · the two packages) — a range, never a promise. */
export const COMMISSION_RANGE = "₹150–₹250 per referral";
