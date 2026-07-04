// /admin/audit — append-only accountability trail (GPS-M4 §2.7, read-only). Filter by action/entity,
// paginate, view meta JSON (no PII), export CSV.
import Link from "next/link";
import { listAuditLog, auditFacets } from "../../../lib/admin/audit-log";
import {
  PageHeading,
  DataTable,
  type Column,
  fmtDateTime,
} from "../../../components/admin/primitives";
import { cn } from "../../../lib/utils";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listAuditLog>>["rows"][number];

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; page?: string }>;
}) {
  const { action, entity, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ rows, total, pageCount }, facets] = await Promise.all([
    listAuditLog({ action, entity, page }),
    auditFacets(),
  ]);

  const columns: Column<Row>[] = [
    { key: "when", header: "When", cell: (r) => fmtDateTime(r.createdAt) },
    {
      key: "actor",
      header: "Actor",
      cell: (r) => r.actorEmail ?? r.actorSupabaseId.slice(0, 12),
    },
    {
      key: "action",
      header: "Action",
      cell: (r) => <span className="font-medium">{r.action}</span>,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (r) => (
        <span className="text-muted">
          {r.entity}
          {r.entityId ? ` · ${r.entityId.slice(0, 12)}` : ""}
        </span>
      ),
    },
    {
      key: "meta",
      header: "Meta",
      cell: (r) => (
        <code className="block max-w-[16rem] truncate text-xs text-muted">
          {r.meta ? JSON.stringify(r.meta) : "—"}
        </code>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <PageHeading
        title="Audit log"
        subtitle={`${total.toLocaleString("en-IN")} recorded events — append-only.`}
        action={
          <Link
            href={`/admin/audit/export${qs({ action, entity })}`}
            className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-sm font-semibold text-charcoal hover:bg-charcoal/5"
          >
            Export CSV
          </Link>
        }
      />

      <form className="flex flex-wrap gap-2" action="/admin/audit" method="get">
        <select
          name="action"
          defaultValue={action ?? ""}
          className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-sm"
        >
          <option value="">All actions</option>
          {facets.actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          name="entity"
          defaultValue={entity ?? ""}
          className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-sm"
        >
          <option value="">All entities</option>
          {facets.entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-semibold text-white"
        >
          Filter
        </button>
      </form>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty="No audit events match."
        minWidth="52rem"
      />

      {pageCount > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <PageLink
            href={`/admin/audit${qs({ action, entity, page: page - 1 })}`}
            disabled={page <= 1}
          >
            ← Prev
          </PageLink>
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          <PageLink
            href={`/admin/audit${qs({ action, entity, page: page + 1 })}`}
            disabled={page >= pageCount}
          >
            Next →
          </PageLink>
        </nav>
      )}
    </section>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled)
    return <span className="text-muted/40">{children}</span>;
  return (
    <Link
      href={href}
      className={cn("font-semibold text-charcoal hover:text-brand-deep")}
    >
      {children}
    </Link>
  );
}
