// /admin/wallet/[userId] — READ-ONLY affiliate wallet detail (Phase E · E2). Summary + full history
// from the ledger. No actions, no money movement. Admin-authorized by the /admin layout.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAffiliateWalletDetail } from "../../../../lib/admin/wallet";
import { formatINR } from "../../../../lib/money";
import {
  PageHeading,
  fmtDateTime,
} from "../../../../components/admin/primitives";
import { Card, CardTitle } from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminWalletDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const detail = await getAffiliateWalletDetail(userId);
  if (!detail) notFound();

  return (
    <section className="space-y-5">
      <Link
        href="/admin/wallet"
        className="text-sm text-muted hover:text-ink"
      >
        ← Back to wallets
      </Link>
      <PageHeading
        title={detail.name || "Affiliate wallet"}
        subtitle={detail.phone ?? undefined}
      />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Available
          </p>
          <p className="font-heading text-xl font-bold text-ink">
            {formatINR(detail.summary.availableInPaise)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Held
          </p>
          <p className="font-heading text-xl font-bold text-ink">
            {formatINR(detail.summary.heldInPaise)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Lifetime
          </p>
          <p className="font-heading text-xl font-bold text-ink">
            {formatINR(detail.summary.lifetimeEarnedInPaise)}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-2 text-base">History</CardTitle>
        {detail.history.length === 0 ? (
          <p className="text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-line/60 text-sm">
            {detail.history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-ink">{h.label}</span>
                <span className="flex items-center gap-3">
                  <span
                    className={
                      h.amountInPaise < 0
                        ? "text-muted"
                        : "font-medium text-ink"
                    }
                  >
                    {h.amountInPaise < 0 ? "−" : "+"}
                    {formatINR(Math.abs(h.amountInPaise))}
                  </span>
                  <span className="text-xs text-muted">
                    {fmtDateTime(h.date)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
