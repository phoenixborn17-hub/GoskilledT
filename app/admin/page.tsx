// /admin — dashboard hub (GPS-M4 §2.0). One glance = state of the business today; pending queues
// surfaced by urgency; recent audit trail. All real aggregates; zero-states truthful.
import { getDashboardData } from "../../lib/admin/queries";
import { formatINR } from "../../lib/money";
import {
  PageHeading,
  StatCard,
  QueueCard,
  fmtDateTime,
} from "../../components/admin/primitives";
import { Card } from "../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const d = await getDashboardData();

  return (
    <section className="space-y-6">
      <PageHeading
        title="Today"
        subtitle="Live business state — real figures, updated on load."
      />

      {/* KPI strip — today with a 7-day trailing sub-figure. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Signups"
          value={d.signupsToday.toLocaleString("en-IN")}
          sub={`${d.signups7d.toLocaleString("en-IN")} in last 7d`}
          href="/admin/users"
        />
        <StatCard
          label="Paid orders"
          value={d.ordersToday.toLocaleString("en-IN")}
          sub={`${d.orders7d.toLocaleString("en-IN")} in last 7d`}
          href="/admin/payments"
        />
        <StatCard
          label="Revenue"
          value={formatINR(d.revenueTodayInPaise)}
          sub={`${formatINR(d.revenue7dInPaise)} in last 7d`}
          href="/admin/payments"
        />
        <StatCard
          label="Active learners"
          value={d.activeLearners.toLocaleString("en-IN")}
          sub="enrolled in ≥1 course"
        />
      </div>

      {/* Pending work — deep-linked queue cards, urgency-highlighted. */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-charcoal">
          Pending work
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QueueCard
            label="KYC review"
            count={d.pendingKyc}
            href="/admin/kyc"
            hint="before payouts"
          />
          <QueueCard
            label="Withdrawals"
            count={d.pendingWithdrawals}
            href="/admin/withdrawals"
            hint="Tuesday run"
          />
          <QueueCard
            label="Review queue"
            count={d.pendingReview}
            href="/admin/review-queue"
            hint="flagged payments"
          />
          <QueueCard
            label="New leads"
            count={d.newLeads}
            href="/admin/leads"
          />
        </div>
      </div>

      {/* Recent audit trail — last 10 admin/money mutations. */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-charcoal">
            Recent activity
          </h2>
          <a
            href="/admin/audit"
            className="text-sm font-semibold text-muted hover:text-charcoal"
          >
            Full audit log →
          </a>
        </div>
        {d.recentAudit.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No admin activity yet.
          </p>
        ) : (
          <ul className="divide-y divide-charcoal/5 text-sm">
            {d.recentAudit.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-charcoal">{a.action}</span>
                <span className="text-muted">
                  {a.entity}
                  {a.entityId ? ` · ${a.entityId.slice(0, 10)}…` : ""}
                </span>
                <span className="text-xs text-muted">{fmtDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* AI hook (GPS-M5+/Command Center): dashboard "ask about today" — Jarvis (DR-016). */}
      {/* TODO(GPS-M5): natural-language "ask about today" entry slot here. */}
    </section>
  );
}
