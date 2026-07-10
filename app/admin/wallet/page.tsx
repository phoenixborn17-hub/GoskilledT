// /admin/wallet — READ-ONLY affiliate wallet overview (Phase E · E2). Lists affiliates with ledger
// activity + their held/available/total (derived from the ledger). No money movement here — payouts
// live only in /admin/withdrawals. Admin-authorized by the /admin layout.
import Link from "next/link";
import { listAffiliateWallets } from "../../../lib/admin/wallet";
import { formatINR } from "../../../lib/money";
import { PageHeading } from "../../../components/admin/primitives";
import { Card } from "../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  const wallets = await listAffiliateWallets();

  return (
    <section className="space-y-5">
      <PageHeading
        title="Wallets"
        subtitle="Read-only affiliate balances from the ledger. No money moves here."
      />
      {wallets.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-muted">
            No affiliate wallet activity yet.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Affiliate</th>
                <th className="py-2 pr-3 font-medium">Available</th>
                <th className="py-2 pr-3 font-medium">Held</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {wallets.map((w) => (
                <tr key={w.userId}>
                  <td className="py-2 pr-3">
                    <span className="font-medium text-charcoal">
                      {w.name || "—"}
                    </span>
                    <span className="block text-xs text-muted">{w.phone}</span>
                  </td>
                  <td className="py-2 pr-3 font-semibold text-charcoal">
                    {formatINR(w.availableInPaise)}
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {formatINR(w.heldInPaise)}
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {formatINR(w.totalInPaise)}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/admin/wallet/${w.userId}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
