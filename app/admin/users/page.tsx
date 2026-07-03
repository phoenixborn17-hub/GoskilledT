// /admin/users (Ticket 6, Task 3) — paginated, searchable, READ-ONLY. Search is a native GET
// form (no client JS). No PII beyond what an admin needs.
import Link from "next/link";
import { listUsers } from "../../../lib/admin/queries";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { rows, total, pageCount } = await listUsers({ page, q });

  const qs = (p: number) => `?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Users <span className="text-base font-normal text-muted">({total})</span></h1>
        <form method="get" className="flex gap-2">
          <input name="q" defaultValue={q ?? ""} placeholder="Search phone / referral code"
            className="h-9 w-56 rounded-lg border border-charcoal/15 px-3 text-sm" aria-label="Search users" />
          <button type="submit" className="h-9 rounded-lg bg-charcoal px-3 text-sm font-medium text-white">Search</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-charcoal/10 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Referral code</th>
              <th className="px-4 py-3 font-medium">Referred by</th>
              <th className="px-4 py-3 font-medium">Enrollments</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No users found.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">{u.referralCode}</td>
                  <td className="px-4 py-3 text-muted">{u.referredBy?.referralCode ?? "—"}</td>
                  <td className="px-4 py-3">{u._count.enrollments}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          {page > 1 && <Link href={qs(page - 1)} className="rounded-lg border border-charcoal/15 px-3 py-1.5">← Prev</Link>}
          {page < pageCount && <Link href={qs(page + 1)} className="rounded-lg border border-charcoal/15 px-3 py-1.5">Next →</Link>}
        </div>
      </div>
    </section>
  );
}
