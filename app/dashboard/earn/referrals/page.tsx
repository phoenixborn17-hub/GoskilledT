// Referrals (GPS-M3 §2.1; Vibrant rollout Slice C). Transparent 3-level network. Works in BOTH
// flag states (no ₹ columns until the flag is ON — this page shows counts/names only, safe in both).
import { getCurrentUser } from "../../../../lib/auth/session";
import { siteUrl } from "../../../../lib/seo";
import { getReferralTree } from "../../../../lib/affiliate/referrals";
import { getReferralConversionStats } from "../../../../lib/affiliate/referral-click";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { ShareBlock } from "../../../../components/affiliate/share-block";
import { ReferralTree } from "../../../../components/affiliate/referral-tree";
import { ConversionStats } from "../../../../components/affiliate/conversion-stats";
import { BackLink } from "../../../../components/nav/back-link";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  const shareUrl = `${siteUrl()}/?ref=${user!.referralCode}`;
  const [tree, stats] = await Promise.all([
    getReferralTree(user!.id),
    getReferralConversionStats(user!.id, user!.referralCode),
  ]);

  return (
    <section
      aria-labelledby="referrals-heading"
      className="gs-vibrant space-y-6"
    >
      <BackLink href="/dashboard/earn" label="Back to Earn" />
      <h1
        id="referrals-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        Referrals
      </h1>

      <div className="vh-card vh-soft vh-accent-network dc-enter space-y-3 p-6">
        <h2 className="font-heading text-h4 font-bold text-ink">
          Your referral link
        </h2>
        <ShareBlock
          shareUrl={shareUrl}
          shareMessage={AFFILIATE_COPY.shareMessage}
        />
      </div>

      <ConversionStats stats={stats} />

      <ReferralTree tree={tree} />
    </section>
  );
}
