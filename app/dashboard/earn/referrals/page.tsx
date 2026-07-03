// Referrals (GPS-M3 §2.1). Transparent 3-level network. Works in BOTH flag states (no ₹ columns
// until the flag is ON — this page shows counts/names only, which are safe in both states).
import { getCurrentUser } from "../../../../lib/auth/session";
import { siteUrl } from "../../../../lib/seo";
import { getReferralTree } from "../../../../lib/affiliate/referrals";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { ShareBlock } from "../../../../components/affiliate/share-block";
import { ReferralTree } from "../../../../components/affiliate/referral-tree";
import { Card, CardTitle } from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  const shareUrl = `${siteUrl()}/?ref=${user!.referralCode}`;
  const tree = await getReferralTree(user!.id);

  return (
    <section aria-labelledby="referrals-heading" className="space-y-6">
      <h1 id="referrals-heading" className="font-heading text-2xl font-bold">
        Referrals
      </h1>

      <Card className="space-y-3 bg-gold/10">
        <CardTitle className="text-base">Your referral link</CardTitle>
        <ShareBlock
          shareUrl={shareUrl}
          shareMessage={AFFILIATE_COPY.shareMessage}
        />
      </Card>

      <ReferralTree tree={tree} />
    </section>
  );
}
