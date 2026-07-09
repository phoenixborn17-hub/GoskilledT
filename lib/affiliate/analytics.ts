// Affiliate analytics — PURE time-series helpers (Phase B / B2 · B4). No DB, no money math of its
// own: adapters fetch canonical rows (ledger entries, referral join dates, withdrawals) and these
// functions bucket them for the graphs. Everything is derived from canon (rebuildable — Art 7.5);
// nothing is fabricated (D-29 — an empty input yields an empty series, never a placeholder number).

export type Bucket = "day" | "month";

export interface DatedValue {
  date: Date;
  value: number; // paise (or a count) — caller decides the unit
}

export interface SeriesPoint {
  key: string; // sortable bucket key, e.g. "2026-07-09" | "2026-07"
  label: string; // human label, e.g. "9 Jul" | "Jul 2026"
  value: number;
}

const IST = "Asia/Kolkata";

/** Bucket key + human label for a date, in IST (DB timestamps are UTC). */
export function bucketKey(
  date: Date,
  bucket: Bucket,
): { key: string; label: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  if (bucket === "month") {
    const label = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      month: "short",
      year: "numeric",
    }).format(date);
    return { key: `${y}-${m}`, label };
  }
  const label = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
  }).format(date);
  return { key: `${y}-${m}-${d}`, label };
}

/** Keep only rows within [from, to] (inclusive). Undefined bounds = open-ended. */
export function filterByDateRange<T extends { date: Date }>(
  rows: T[],
  from?: Date,
  to?: Date,
): T[] {
  return rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
}

/** Sum values into buckets, ascending by key. Empty input → empty series. */
export function sumByBucket(rows: DatedValue[], bucket: Bucket): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  for (const r of rows) {
    const { key, label } = bucketKey(r.date, bucket);
    const point = map.get(key);
    if (point) point.value += r.value;
    else map.set(key, { key, label, value: r.value });
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** Running (cumulative) total across per-bucket sums — for growth/balance lines. */
export function cumulativeByBucket(
  rows: DatedValue[],
  bucket: Bucket,
): SeriesPoint[] {
  const perBucket = sumByBucket(rows, bucket);
  let running = 0;
  return perBucket.map((p) => ({ ...p, value: (running += p.value) }));
}

/** Convenience for count series (each row counts as 1). */
export function countByBucket(dates: Date[], bucket: Bucket): SeriesPoint[] {
  return sumByBucket(
    dates.map((date) => ({ date, value: 1 })),
    bucket,
  );
}
