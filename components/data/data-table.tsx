"use client";
import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";
import { EmptyState, type EmptyStateProps } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";

export interface Column<Row> {
  key: string;
  header: React.ReactNode;
  /** Cell renderer. Use <DataValue> for money/counts so failures fail-safe. */
  render: (row: Row) => React.ReactNode;
  align?: "left" | "right" | "center";
  /** Enable client-side sort; requires `sortValue`. */
  sortable?: boolean;
  sortValue?: (row: Row) => number | string;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** State machine — every data component carries loading/empty/error (D-29). */
  state?: "loading" | "ready" | "empty" | "error";
  empty?: EmptyStateProps;
  onRetry?: () => void;
  /** Caption for screen readers. */
  caption?: string;
  className?: string;
}

/**
 * Sortable, responsive data table (Experience System §10) — the base for TransactionTable,
 * LeaderboardTable, Network tables. Horizontal-scrolls on mobile; sort is client-side and
 * accessible (aria-sort + a labelled sort button). Loading/empty/error are built in.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  state = "ready",
  empty,
  onRetry,
  caption,
  className,
}: DataTableProps<Row>) {
  const [sort, setSort] = React.useState<{
    key: string;
    dir: "asc" | "desc";
  } | null>(null);

  const sortedRows = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const getVal = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, columns]);

  if (state === "loading") {
    return (
      <div className="space-y-2" aria-busy>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return <ErrorState onRetry={onRetry} className="py-8" />;
  }
  if (state === "empty" && empty) {
    return <EmptyState {...empty} className="py-8" />;
  }

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-small">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-left">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              const alignClass =
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                    ? "text-center"
                    : "text-left";
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    isSorted
                      ? sort!.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-caption font-semibold uppercase tracking-wide text-ink-muted",
                    alignClass,
                  )}
                >
                  {col.sortable && col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sort!.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown
                          className="h-3 w-3 opacity-50"
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-line/70 last:border-0 hover:bg-surface-sunken"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 py-3 text-ink",
                    col.align === "right" && "text-right tabular-nums",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
