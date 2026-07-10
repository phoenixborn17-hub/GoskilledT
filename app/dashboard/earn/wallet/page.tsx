// Wallet (GPS-M3 §2.2, Tier A · Redesign U5). The money-truth screen — Register-2 CALM (neutral +
// thin gold accents + charcoal tabular numbers). DISPLAY-ONLY re-skin: the ledger reads, the
// withdraw gating (canWithdraw), held-credit countdowns and history are BYTE-IDENTICAL — money math
// untouched. FLAG OFF → honest recorded-&-safe status + notify-me (no ₹ promise). FLAG ON → held/
// available from the ledger + the Withdraw truth-surface (form only when every rule is met; never a
// fake "Paid"; inline KYC gate).
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
import { AFFILIATE_LABELS } from "../../../../lib/affiliate/labels";
import { MiniChart } from "../../../../components/affiliate/mini-chart";
import { WalletSummary } from "../../../../components/affiliate/wallet-summary";
import { HeldCreditRow } from "../../../../components/affiliate/held-credit-row";
import { WithdrawForm } from "../../../../components/affiliate/withdraw-form";
import { PayoutStatusLine } from "../../../../components/affiliate/payout-status-line";
import { NotifyMeToggle } from "../../../../components/affiliate/notify-me-toggle";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const user = await getCurrentUser();
  const flagOn = payoutsEnabled();

  return (
    <section aria-labelledby="wallet-heading" className="space-y-6">
      <h1
        id="wallet-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        Wallet
      </h1>
      <PayoutStatusLine open={flagOn} />
      {flagOn ? <WalletMoney userId={user!.id} /> : <WalletPending />}
    </section>
  );
}

// FLAG OFF — earnings are recorded & safe; honest status + notify-me. No ₹ promise (LC #17).
function WalletPending() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-body text-ink">
          Your commissions are being recorded safely against your account. When
          withdrawals open, your available balance and payout options will
          appear right here — with full history.
        </p>
      </Card>
      <NotifyMeToggle />
    </div>
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

  // Money-truth gating — BYTE-IDENTICAL to the pre-reskin logic.
  const kycVerified = kycStatus === "APPROVED";
  const canWithdraw = kycVerified && summary.availableInPaise > 0 && !pending;
  const balanceSeries = cumulativeByBucket(balanceData, "day");

  return (
    <div className="space-y-6">
      <WalletSummary summary={summary} />

      {/* Balance over time (running total from the ledger). */}
      <Card className="space-y-2">
        <h2 className="font-heading text-h4 font-semibold text-ink">
          {AFFILIATE_LABELS.walletGraph}
        </h2>
        <MiniChart
          points={balanceSeries}
          kind="line"
          format={(n) => formatINR(n)}
          empty="No wallet activity yet."
        />
      </Card>

      {/* Withdraw — truth surface: the form renders ONLY when every rule is met; else the honest reason. */}
      <Card className="space-y-3">
        <h2 className="font-heading text-h4 font-semibold text-ink">
          Withdraw
        </h2>
        {canWithdraw ? (
          <WithdrawForm availableInPaise={summary.availableInPaise} />
        ) : pending ? (
          <p className="text-small text-ink-muted">
            You have a withdrawal in progress. We&apos;ll update you here once
            it&apos;s paid.
          </p>
        ) : !kycVerified ? (
          <div className="space-y-3">
            <p className="text-small text-ink-muted">
              Complete KYC first to withdraw your available balance.
            </p>
            <Link href="/dashboard/earn/kyc" className="inline-block">
              <Button variant="outline" className="w-auto">
                Start KYC →
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-small text-ink-muted">
            Nothing available to withdraw yet — held commissions clear after the
            48-hour window.
          </p>
        )}
      </Card>

      {/* Held credits with per-credit countdown */}
      {held.length > 0 && (
        <Card>
          <h2 className="mb-1 font-heading text-h4 font-semibold text-ink">
            Clearing soon
          </h2>
          <ul className="divide-y divide-line">
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
        <h2 className="mb-1 font-heading text-h4 font-semibold text-ink">
          History
        </h2>
        {history.length === 0 ? (
          <p className="text-small text-ink-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-3 text-small"
              >
                <span className="text-ink">{h.label}</span>
                <span
                  className={
                    h.amountInPaise < 0
                      ? "tabular-nums text-ink-muted"
                      : "font-medium tabular-nums text-ink"
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
      <p className="text-caption text-ink-muted">
        How it works: when a friend you referred buys a course, your commission
        is <strong>held for 48 hours</strong> (our no-questions refund window).
        After that it becomes <strong>available</strong> to withdraw. If they
        refund inside 48 hours, the held commission is simply cancelled — never
        money you already withdrew.
      </p>
    </div>
  );
}
