// /admin/payments (Ticket 6, Task 3) — orders table, filter by status, READ-ONLY.
import Link from "next/link";
import { listPayments } from "../../../lib/admin/queries";
import { formatINR } from "../../../lib/money";
import type { OrderStatus } from "../../../lib/generated/prisma";
import { cn } from "../../../lib/utils";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["CREATED", "PAID", "FAILED", "REFUNDED"];

const statusStyle: Record<OrderStatus, string> = {
  PAID: "bg-brand/10 text-brand",
  CREATED: "bg-charcoal/5 text-charcoal/60",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gold/20 text-charcoal",
};

function fmtDate(d: Date | null) {
  return d ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;
  const orders = await listPayments({ status });

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Payments</h1>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <FilterChip href="/admin/payments" active={!status}>All</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} href={`/admin/payments?status=${s}`} active={status === s}>{s}</FilterChip>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-charcoal/10 text-left text-charcoal/50">
            <tr>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Paid at</th>
              <th className="px-4 py-3 font-medium">Razorpay</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No orders.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{o.user.phone ?? "—"}</td>
                  <td className="px-4 py-3">{o.package.name}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(o.amountInPaise)}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusStyle[o.status])}>{o.status}</span></td>
                  <td className="px-4 py-3 text-charcoal/60">{fmtDate(o.paidAt)}</td>
                  <td className="px-4 py-3 text-xs text-charcoal/40">{o.razorpayPaymentId ?? o.razorpayOrderId ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal/40">Showing up to 100 most recent orders.</p>
    </section>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined}
      className={cn("rounded-full border px-3 py-1.5 text-sm font-medium",
        active ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-charcoal/70 hover:bg-charcoal/5")}>
      {children}
    </Link>
  );
}
