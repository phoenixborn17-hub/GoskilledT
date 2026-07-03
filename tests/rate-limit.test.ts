// Ticket 6, Task 4 — rate-limit logic. Pure, deterministic (fixed `now`).
import { describe, it, expect, beforeEach } from "vitest";
import { withinLimit, rateLimit, __resetRateLimits } from "../lib/rate-limit";

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
