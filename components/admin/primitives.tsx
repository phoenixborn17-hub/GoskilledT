// Shared admin presentational primitives (GPS-M4 §3A). Server-safe, charcoal-neutral, mobile
// usable at 320px (tables scroll in their own container). Zero-states are truthful ("0", "None").
import * as React from "react";
import Link from "next/link";
import { Card } from "../ui/card";
import { cn } from "../../lib/utils";

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold text-charcoal">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** A KPI stat card. Optional `href` makes it a deep link; optional `sub` shows a trailing note. */
export function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <Card className="h-full p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-charcoal">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </Card>
  );
  return href ? (
    <Link
      href={href}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

/** A pending-work card: count + label, deep-linking into a queue. Highlights when count > 0. */
export function QueueCard({
  label,
  count,
  href,
  hint,
}: {
  label: string;
  count: number;
  href: string;
  hint?: string;
}) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        active
          ? "border-brand/30 bg-brand/5 hover:bg-brand/10"
          : "border-charcoal/10 bg-white hover:bg-charcoal/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-charcoal">{label}</span>
        <span
          className={cn(
            "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold",
            active ? "bg-brand text-brand-fg" : "bg-charcoal/5 text-muted",
          )}
        >
          {count}
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Link>
  );
}

/** Column spec for the shared data table. `cell` renders the row's value. */
export interface Column<Row> {
  key: string;
  header: string;
  cell: (row: Row) => React.ReactNode;
  className?: string;
}

/**
 * The shared admin data table (extracted per §3A). Horizontal-scroll container keeps it usable at
 * 320px; a truthful empty state renders when there are no rows.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  empty = "Nothing here yet.",
  minWidth = "48rem",
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  empty?: string;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="border-b border-charcoal/10 text-left text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-charcoal/5 last:border-0"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
}
