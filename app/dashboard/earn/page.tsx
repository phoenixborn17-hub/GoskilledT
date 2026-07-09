// Earn hub (GPS-M3 §2.0). Flag-aware: pre-D-01 = honest invite hub (no ₹, LC #17 copy);
// post-flag = earnings summary from the ledger. Server component; the gold theme + noindex + sub-nav
// come from the earn layout.
import Link from "next/link";
import { Users, Wallet as WalletIcon } from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { payoutsEnabled } from "../../../lib/env";
import { siteUrl } from "../../../lib/seo";
import { formatINR } from "../../../lib/money";
import { getReferralTree } from "../../../lib/affiliate/referrals";
import { getWalletSummaryFor } from "../../../lib/wallet/queries";
import {
  getEarningSeriesData,
  getPaymentsReceivedData,
} from "../../../lib/affiliate/graph-queries";
import { sumByBucket } from "../../../lib/affiliate/analytics";
import { AFFILIATE_COPY } from "../../../lib/affiliate/copy";
import { AFFILIATE_LABELS } from "../../../lib/affiliate/labels";
import { ShareBlock } from "../../../components/affiliate/share-block";
import { MiniChart } from "../../../components/affiliate/mini-chart";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

export default async function EarnPage() {
  const user = await getCurrentUser();
  const flagOn = payoutsEnabled();
  const shareUrl = `${siteUrl()}/?ref=${user!.referralCode}`;
  const tree = await getReferralTree(user!.id);

  return (
    <section aria-labelledby="earn-heading" className="space-y-6">
      {/* Guru "explain my balance" slot (§1E, GPS-M5) reserved on the wallet — no UI in M3. */}
      <h1 id="earn-heading" className="font-heading text-2xl font-bold">
        Earn
      </h1>

      {flagOn ? (
        <PostFlag
          userId={user!.id}
          shareUrl={shareUrl}
          inviteCount={tree.l1Count}
        />
      ) : (
        <PreFlag shareUrl={shareUrl} inviteCount={tree.l1Count} />
      )}
    </section>
  );
}

// ── FLAG OFF — invite-only, zero ₹, LC #17 copy ──
function PreFlag({
  shareUrl,
  inviteCount,
}: {
  shareUrl: string;
  inviteCount: number;
}) {
  return (
    <div className="space-y-5">
      <Card className="space-y-4 bg-gold/10">
        <div>
          <CardTitle>{AFFILIATE_COPY.inviteHeading}</CardTitle>
          <CardDescription>{AFFILIATE_COPY.inviteBody}</CardDescription>
        </div>
        <ShareBlock
          shareUrl={shareUrl}
          shareMessage={AFFILIATE_COPY.shareMessage}
        />
      </Card>

      <Card className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-charcoal"
          aria-hidden
        >
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-charcoal">
            {inviteCount === 0
              ? AFFILIATE_COPY.inviteZero
              : `${inviteCount} friend${inviteCount === 1 ? "" : "s"} invited`}
          </p>
          <Link
            href="/dashboard/earn/referrals"
            className="text-sm font-semibold text-brand"
          >
            See your invites →
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ── FLAG ON — earnings summary from the ledger ──
async function PostFlag({
  userId,
  shareUrl,
  inviteCount,
}: {
  userId: string;
  shareUrl: string;
  inviteCount: number;
}) {
  const [summary, earningData, paymentsData] = await Promise.all([
    getWalletSummaryFor(userId),
    getEarningSeriesData(userId),
    getPaymentsReceivedData(userId),
  ]);
  const earningSeries = sumByBucket(earningData, "month");
  const paymentsSeries = sumByBucket(paymentsData, "month");
  return (
    <div className="space-y-5">
      <Card className="bg-gold/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Available to withdraw
        </p>
        <p className="font-heading text-3xl font-extrabold text-charcoal">
          {formatINR(summary.availableInPaise)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {formatINR(summary.heldInPaise)} still clearing (48-hour hold)
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/earn/wallet" className="max-w-[10rem] flex-1">
            <Button variant="gold">
              <WalletIcon className="mr-2 h-4 w-4" aria-hidden /> Wallet
            </Button>
          </Link>
          <Link
            href="/dashboard/earn/referrals"
            className="max-w-[10rem] flex-1"
          >
            <Button variant="outline">Referrals</Button>
          </Link>
        </div>
      </Card>

      {/* B2 — earnings + payments-received graphs (derived from the ledger; honest empty states). */}
      <Card className="space-y-2">
        <CardTitle className="text-base">
          {AFFILIATE_LABELS.earningGraph}
        </CardTitle>
        <MiniChart
          points={earningSeries}
          kind="bar"
          format={(n) => formatINR(n)}
          empty="No commissions credited yet — they'll show here as your network buys."
        />
      </Card>
      <Card className="space-y-2">
        <CardTitle className="text-base">
          {AFFILIATE_LABELS.paymentsGraph}
        </CardTitle>
        <MiniChart
          points={paymentsSeries}
          kind="bar"
          format={(n) => formatINR(n)}
          empty="No payments received yet."
        />
      </Card>

      <Card className="space-y-3">
        <div>
          <CardTitle className="text-base">Invite more friends</CardTitle>
          <CardDescription>
            {inviteCount === 0
              ? AFFILIATE_COPY.inviteZero
              : `${inviteCount} friend${inviteCount === 1 ? "" : "s"} invited so far.`}
          </CardDescription>
        </div>
        <ShareBlock
          shareUrl={shareUrl}
          shareMessage={AFFILIATE_COPY.shareMessage}
        />
      </Card>
    </div>
  );
}
