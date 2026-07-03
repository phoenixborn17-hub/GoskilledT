// Ticket 6, Task 4 — rate-limit logic. Pure, deterministic (fixed `now`).
import { describe, it, expect, beforeEach } from "vitest";
import { withinLimit, rateLimit, pruneBuckets, __resetRateLimits, __bucketCount } from "../lib/rate-limit";

describe("withinLimit (pure)", () => {
  it("allows under the max", () => {
    expect(withinLimit([1, 2], 100, 1000, 3)).toBe(true);
  });
  it("blocks at the max", () => {
    expect(withinLimit([1, 2, 3], 100, 1000, 3)).toBe(false);
  });
  it("ignores timestamps outside the window", () => {
    // two old (>window) + one recent → only 1 counts, under max 3
    expect(withinLimit([1, 2, 9600], 10000, 1000, 3)).toBe(true);
  });
});

describe("rateLimit (stateful)", () => {
  beforeEach(() => __resetRateLimits());

  it("allows up to max, then blocks with retryAfter", () => {
    const now = 1_000_000;
    const opts = { max: 2, windowMs: 1000 };
    expect(rateLimit("ip-a", opts, now).ok).toBe(true);
    expect(rateLimit("ip-a", opts, now).ok).toBe(true);
    const blocked = rateLimit("ip-a", opts, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("recovers after the window passes", () => {
    const opts = { max: 1, windowMs: 1000 };
    expect(rateLimit("ip-b", opts, 0).ok).toBe(true);
    expect(rateLimit("ip-b", opts, 500).ok).toBe(false); // still in window
    expect(rateLimit("ip-b", opts, 1500).ok).toBe(true); // window passed
  });

  it("keys are independent", () => {
    const opts = { max: 1, windowMs: 1000 };
    expect(rateLimit("ip-c", opts, 0).ok).toBe(true);
    expect(rateLimit("ip-d", opts, 0).ok).toBe(true);
  });
});

describe("bucket pruning (memory bound)", () => {
  beforeEach(() => __resetRateLimits());

  it("pruneBuckets drops fully-aged-out keys but keeps in-window ones", () => {
    const opts = { max: 5, windowMs: 1000 };
    rateLimit("stale", opts, 0);
    rateLimit("fresh", opts, 900);
    expect(__bucketCount()).toBe(2);
    pruneBuckets(1500, 1000); // "stale"(@0) aged out, "fresh"(@900) still in window
    expect(__bucketCount()).toBe(1);
  });

  it("the periodic sweep collects idle keys that never come back", () => {
    const opts = { max: 5, windowMs: 1000 };
    for (let i = 0; i < 100; i++) rateLimit(`ip-${i}`, opts, 0);
    expect(__bucketCount()).toBe(100);
    // A later request past the sweep interval triggers a global sweep before it records.
    rateLimit("late", opts, 700_000);
    expect(__bucketCount()).toBe(1); // the 100 @0 were swept; only "late" remains
  });
});
