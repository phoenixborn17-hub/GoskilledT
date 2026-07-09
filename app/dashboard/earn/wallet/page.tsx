// Wallet (GPS-M3 §2.2, Tier A). The money-truth screen. FLAG OFF → LC #17 pending state (no ₹).
// FLAG ON → held/available (from ledger), withdrawal (rules server-enforced), history, lifecycle.
import Link from "next/link";
import { getCurrentUser } from "../../../../lib/auth/session";
import { payoutsEnabled } from "../../../../lib/env";
import { formatINR } from "../../../../lib/money";
import {
  getWalletSummaryFor,
  getHeldCredits,
  getWalletHistory,
  hasPendingWithdrawal,
} from "../../../../lib/wallet/queries";
import { getWalletBalanceData } from "../../../../lib/affiliate/graph-queries";
import { cumulativeByBucket } from "../../../../lib/affiliate/analytics";
import { getKycStatus } from "../../../../lib/kyc/queries";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { AFFILIATE_LABELS } from "../../../../lib/affiliate/labels";
import { MiniChart } from "../../../../components/affiliate/mini-chart";
import { WalletSummary } from "../../../../components/affiliate/wallet-summary";
import { HeldCreditRow } from "../../../../components/affiliate/held-credit-row";
import { WithdrawForm } from "../../../../components/affiliate/withdraw-form";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getCurrentUser();

  return (
    <section aria-labelledby="wallet-heading" className="space-y-6">
      <h1 id="wallet-heading" className="font-heading text-2xl font-bold">
        Wallet
      </h1>
      {payoutsEnabled() ? (
        <WalletMoney userId={user!.id} />
      ) : (
        <Card className="bg-gold/10">
          <CardTitle>{AFFILIATE_COPY.moneyPendingHeading}</CardTitle>
          <CardDescription>{AFFILIATE_COPY.moneyPendingBody}</CardDescription>
        </Card>
      )}
    </section>
  );
}

async function WalletMoney({ userId }: { userId: string }) {
  const now = new Date();
  const [summary, held, history, pending, kycStatus, balanceData] =
    await Promise.all([
      getWalletSummaryFor(userId, now),
      getHeldCredits(userId, now),
      getWalletHistory(userId),
      hasPendingWithdrawal(userId),
      getKycStatus(userId),
      getWalletBalanceData(userId),
    ]);

  const kycVerified = kycStatus === "APPROVED";
  const canWithdraw = kycVerified && summary.availableInPaise > 0 && !pending;
  const balanceSeries = cumulativeByBucket(balanceData, "day");

  return (
    <div className="space-y-6">
      <WalletSummary summary={summary} />

      {/* B4 — balance over time (running total from the ledger). Held vs available split is above. */}
      <Card className="space-y-2">
        <CardTitle className="text-base">
          {AFFILIATE_LABELS.walletGraph}
        </CardTitle>
        <MiniChart
          points={balanceSeries}
          kind="line"
          format={(n) => formatINR(n)}
          empty="No wallet activity yet."
        />
      </Card>

      {/* Withdrawal — form only when every rule is met; otherwise the honest reason. */}
      <Card className="space-y-3">
        <CardTitle className="text-base">Withdraw</CardTitle>
        {canWithdraw ? (
          <WithdrawForm availableInPaise={summary.availableInPaise} />
        ) : pending ? (
          <p className="text-sm text-muted">
            You have a withdrawal in progress. We&apos;ll update you here once
            it&apos;s paid.
          </p>
        ) : !kycVerified ? (
          <p className="text-sm text-muted">
            Complete{" "}
            <Link
              href="/dashboard/earn/kyc"
              className="font-semibold text-brand"
            >
              KYC verification
            </Link>{" "}
            to withdraw your available balance.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Nothing available to withdraw yet — held commissions clear after the
            48-hour window.
          </p>
        )}
      </Card>

      {/* Held credits with per-credit countdown */}
      {held.length > 0 && (
        <Card>
          <CardTitle className="mb-1 text-base">Clearing soon</CardTitle>
          <ul className="divide-y divide-charcoal/5">
            {held.map((h, i) => (
              <HeldCreditRow
                key={i}
                amountInPaise={h.amountInPaise}
                holdUntil={h.holdUntil}
                now={now}
              />
            ))}
          </ul>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardTitle className="mb-1 text-base">History</CardTitle>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-charcoal/5">
            {history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="text-charcoal">{h.label}</span>
                <span
                  className={
                    h.amountInPaise < 0
                      ? "text-muted"
                      : "font-medium text-charcoal"
                  }
                >
                  {h.amountInPaise < 0 ? "−" : "+"}
                  {formatINR(Math.abs(h.amountInPaise))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Lifecycle explainer — plain language (DR-025) */}
      <p className="text-xs text-muted">
        How it works: when a friend you referred buys a course, your commission
        is <strong>held for 48 hours</strong> (our no-questions refund window).
        After that it becomes <strong>available</strong> to withdraw. If they
        refund inside 48 hours, the held commission is simply cancelled — never
        money you already withdrew.
      </p>
    </div>
  );
}
