// Commissions (GPS-M3 §2.3, Tier A). Line-item transparency — every ₹ traceable to a referral +
// ledger entry. Totals equal the wallet (same ledger source). FLAG OFF → LC #17 pending state.
import { getCurrentUser } from "../../../../lib/auth/session";
import { payoutsEnabled } from "../../../../lib/env";
import { formatINR } from "../../../../lib/money";
import {
  getCommissionLines,
  getWalletSummaryFor,
  type CommissionState,
} from "../../../../lib/wallet/queries";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

const STATE_LABEL: Record<CommissionState, string> = {
  HELD: "Held",
  AVAILABLE: "Available",
  CANCELLED: "Cancelled (refund)",
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
    <section aria-labelledby="commissions-heading" className="space-y-6">
      <h1 id="commissions-heading" className="font-heading text-2xl font-bold">
        Commissions
      </h1>
      {payoutsEnabled() ? (
        <CommissionsTable userId={user!.id} />
      ) : (
        <Card className="bg-gold/10">
          <CardTitle>{AFFILIATE_COPY.moneyPendingHeading}</CardTitle>
          <CardDescription>{AFFILIATE_COPY.moneyPendingBody}</CardDescription>
        </Card>
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
      <Card className="text-center text-muted">
        No commissions yet. Share your link — commissions appear here when a
        friend you referred buys a course.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <caption className="sr-only">Your commissions, per referral</caption>
        <thead>
          <tr className="border-b border-charcoal/10 text-left">
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              Level
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              Package
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              Amount
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-charcoal/5">
              <td className="px-4 py-3 text-charcoal">{formatDate(l.date)}</td>
              <td className="px-4 py-3 text-charcoal">
                {l.level ? `L${l.level}` : "—"}
              </td>
              <td className="px-4 py-3 text-charcoal">
                {l.packageName ?? "—"}
              </td>
              <td className="px-4 py-3 text-charcoal">
                {l.amountInPaise < 0 ? "−" : ""}
                {formatINR(Math.abs(l.amountInPaise))}
              </td>
              <td className="px-4 py-3 text-charcoal">
                {STATE_LABEL[l.state]}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-charcoal/10 font-semibold">
            <td className="px-4 py-3" colSpan={3}>
              Available / Held
            </td>
            <td className="px-4 py-3" colSpan={2}>
              {formatINR(summary.availableInPaise)} /{" "}
              {formatINR(summary.heldInPaise)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
