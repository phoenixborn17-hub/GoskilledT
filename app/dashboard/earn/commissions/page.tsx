// Commissions (GPS-M3 §2.3, Tier A; Vibrant rollout Slice C). Line-item transparency — every ₹
// traceable to a referral + ledger entry. Totals equal the wallet (same ledger source). FLAG OFF →
// LC #17 pending state. Money-row treatment (Command Center Spec §5.4): tabular right-aligned ₹,
// status chip tones (held-amber / available-green / cancelled-neutral) — colour is never the only
// signal, the text label always carries the state too.
import { getCurrentUser } from "../../../../lib/auth/session";
import { payoutsEnabled } from "../../../../lib/env";
import { formatINR } from "../../../../lib/money";
import {
  getCommissionLines,
  getWalletSummaryFor,
  type CommissionState,
} from "../../../../lib/wallet/queries";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { BackLink } from "../../../../components/nav/back-link";

export const dynamic = "force-dynamic";

const STATE_LABEL: Record<CommissionState, string> = {
  HELD: "Held",
  AVAILABLE: "Available",
  CANCELLED: "Cancelled (refund)",
};

const STATE_CHIP: Record<CommissionState, string> = {
  HELD: "bg-warning-strong/10 text-warning-strong",
  AVAILABLE: "bg-success/10 text-success",
  CANCELLED: "bg-line text-ink-muted",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function CommissionsPage() {
  const user = await getCurrentUser();

  return (
    <section
      aria-labelledby="commissions-heading"
      className="gs-vibrant space-y-6"
    >
      <BackLink href="/dashboard/earn" label="Back to Earn" />
      <h1
        id="commissions-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        Commissions
      </h1>
      {payoutsEnabled() ? (
        <CommissionsTable userId={user!.id} />
      ) : (
        <div className="vh-card vh-soft vh-accent-earn dc-enter p-6">
          <h2 className="font-heading text-h4 font-bold text-ink">
            {AFFILIATE_COPY.moneyPendingHeading}
          </h2>
          <p className="mt-1 text-body text-ink-muted">
            {AFFILIATE_COPY.moneyPendingBody}
          </p>
        </div>
      )}
    </section>
  );
}

async function CommissionsTable({ userId }: { userId: string }) {
  const now = new Date();
  const [lines, summary] = await Promise.all([
    getCommissionLines(userId, now),
    getWalletSummaryFor(userId, now),
  ]);

  if (lines.length === 0) {
    return (
      <div className="vh-card vh-soft vh-accent-earn dc-enter p-6 text-center text-ink-muted">
        No commissions yet. Share your link — commissions appear here when a
        friend you referred buys a course.
      </div>
    );
  }

  return (
    <div className="vh-card vh-soft vh-accent-earn dc-enter overflow-x-auto p-0">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <caption className="sr-only">Your commissions, per referral</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
              Level
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
              Package
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right font-medium text-ink-muted"
            >
              Amount
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-ink-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-line/60">
              <td className="px-4 py-3 text-ink">{formatDate(l.date)}</td>
              <td className="px-4 py-3 text-ink">
                {l.level ? `L${l.level}` : "—"}
              </td>
              <td className="px-4 py-3 text-ink">{l.packageName ?? "—"}</td>
              <td className="dc-number px-4 py-3 text-right tabular-nums text-ink">
                {l.amountInPaise < 0 ? "−" : ""}
                {formatINR(Math.abs(l.amountInPaise))}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-caption font-semibold ${STATE_CHIP[l.state]}`}
                >
                  {STATE_LABEL[l.state]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-semibold">
            <td className="px-4 py-3" colSpan={3}>
              Available / Held
            </td>
            <td
              className="dc-number px-4 py-3 text-right tabular-nums"
              colSpan={2}
            >
              {formatINR(summary.availableInPaise)} /{" "}
              {formatINR(summary.heldInPaise)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
