// /admin — overview (Ticket 6, Task 3). Read-only counts. Payouts flag shown read-only
// (it's an env flag by design — D-01/M5).
import Link from "next/link";
import { getAdminOverview } from "../../lib/admin/queries";
import { formatINR } from "../../lib/money";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <Card className="h-full">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-charcoal">
        {value}
      </p>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();
  const stages = [
    "NEW",
    "WEBINAR_REGISTERED",
    "CONTACTED",
    "CONVERTED",
    "LOST",
  ];

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Users"
          value={o.users.toLocaleString("en-IN")}
          href="/admin/users"
        />
        <Stat
          label="Paid orders"
          value={o.paidOrders.toLocaleString("en-IN")}
          href="/admin/payments"
        />
        <Stat
          label="Revenue (paid)"
          value={formatINR(o.revenueInPaise)}
          href="/admin/payments"
        />
        <Stat
          label="Pending review"
          value={o.pendingReview.toLocaleString("en-IN")}
          href="/admin/review-queue"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Leads by stage</h2>
            <Link
              href="/admin/leads"
              className="text-sm font-semibold text-muted hover:text-charcoal"
            >
              View all →
            </Link>
          </div>
          <ul className="space-y-1.5 text-sm">
            {stages.map((s) => (
              <li
                key={s}
                className="flex items-center justify-between border-b border-charcoal/5 pb-1.5 last:border-0"
              >
                <span className="text-muted">{s.replace("_", " ")}</span>
                <span className="font-semibold">{o.leadsByStage[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold">
            Affiliate payouts
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={o.payoutsEnabled ? "brand" : "muted"}>
              {o.payoutsEnabled ? "ON" : "OFF"}
            </Badge>
            <span className="text-sm text-muted">D-01 gate</span>
          </div>
          {/* Read-only: this is an env flag by design (AFFILIATE_PAYOUTS_ENABLED). */}
          <p className="mt-3 text-xs text-muted">
            Read-only — change via the <code>AFFILIATE_PAYOUTS_ENABLED</code>{" "}
            environment variable.
          </p>
        </Card>
      </div>
    </section>
  );
}
