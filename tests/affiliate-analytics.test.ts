// Phase B / B2 · B4 — pure analytics helpers + the L1 CSV serializer. No DB.
import { describe, it, expect } from "vitest";
import {
  bucketKey,
  sumByBucket,
  cumulativeByBucket,
  countByBucket,
  filterByDateRange,
} from "@/lib/affiliate/analytics";
import { l1ToCsv } from "@/lib/affiliate/network";

const d = (iso: string) => new Date(iso);

describe("bucketKey (IST)", () => {
  it("day + month keys are IST-based and sortable", () => {
    const day = bucketKey(d("2026-07-09T06:00:00Z"), "day"); // 11:30 IST → 9 Jul
    expect(day.key).toBe("2026-07-09");
    const month = bucketKey(d("2026-07-09T06:00:00Z"), "month");
    expect(month.key).toBe("2026-07");
  });
});

describe("sumByBucket / cumulativeByBucket / countByBucket", () => {
  const rows = [
    { date: d("2026-06-10T06:00:00Z"), value: 100 },
    { date: d("2026-07-01T06:00:00Z"), value: 50 },
    { date: d("2026-07-20T06:00:00Z"), value: 25 },
  ];
  it("sums per bucket, ascending by key", () => {
    const s = sumByBucket(rows, "month");
    expect(s.map((p) => [p.key, p.value])).toEqual([
      ["2026-06", 100],
      ["2026-07", 75],
    ]);
  });
  it("cumulative running total", () => {
    const c = cumulativeByBucket(rows, "month");
    expect(c.map((p) => p.value)).toEqual([100, 175]);
  });
  it("count series treats each date as 1", () => {
    const c = countByBucket([rows[1].date, rows[2].date], "month");
    expect(c).toEqual([
      { key: "2026-07", label: expect.any(String), value: 2 },
    ]);
  });
  it("empty input → empty series (no fabricated points)", () => {
    expect(sumByBucket([], "day")).toEqual([]);
    expect(cumulativeByBucket([], "month")).toEqual([]);
  });
});

describe("filterByDateRange", () => {
  const rows = [
    { date: d("2026-06-01T00:00:00Z"), value: 1 },
    { date: d("2026-07-15T00:00:00Z"), value: 2 },
    { date: d("2026-08-01T00:00:00Z"), value: 3 },
  ];
  it("keeps rows within inclusive bounds", () => {
    const r = filterByDateRange(rows, d("2026-07-01T00:00:00Z"));
    expect(r.map((x) => x.value)).toEqual([2, 3]);
  });
});

describe("l1ToCsv", () => {
  it("serializes header + rows and quotes cells containing commas/quotes", () => {
    const csv = l1ToCsv([
      {
        name: "Rahul, Sr.",
        mobile: "+919812345678",
        joinedAt: d("2026-07-09T06:00:00Z"),
        packages: ["Career Booster"],
      },
      {
        name: null,
        mobile: null,
        joinedAt: d("2026-07-08T06:00:00Z"),
        packages: [],
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name,Mobile,Joined (IST),Packages");
    expect(lines[1]).toContain('"Rahul, Sr."'); // comma → quoted
    expect(lines[1]).toContain("+919812345678");
    expect(lines[2].startsWith(",,")).toBe(true); // null name + mobile → empty cells
  });
});
