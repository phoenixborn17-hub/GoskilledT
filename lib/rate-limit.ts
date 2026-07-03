// Minimal in-memory per-key rate limiter for public write endpoints (Ticket 6).
// TECH DEBT: in-memory = per-process only; resets on deploy and doesn't span instances.
// Fine for launch abuse-dampening; swap for Redis/Upstash when we scale horizontally.

/** Pure, testable core: is a new request allowed given prior timestamps in the window? */
export function withinLimit(timestamps: number[], now: number, windowMs: number, max: number): boolean {
  const recent = timestamps.filter((t) => now - t < windowMs);
  return recent.length < max;
}

const buckets = new Map<string, number[]>();

// Bucket pruning (Ticket 8, Task 0): without a sweep the Map grows one entry per distinct
// key (e.g. per attacker IP) forever, since a key that never returns is never revisited to be
// cleaned. We prune on access (below) AND run a periodic full sweep so idle keys can't leak.
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/** Remove buckets whose timestamps have all aged out of `windowMs`. Bounds memory. */
export function pruneBuckets(now: number, windowMs: number): void {
  for (const [key, ts] of buckets) {
    const recent = ts.filter((t) => now - t < windowMs);
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }
  lastSweepAt = now;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

/** Record + check a hit for `key`. Default: 5 requests / 10 minutes. */
export function rateLimit(
  key: string,
  opts: { windowMs?: number; max?: number } = {},
  now: number = Date.now(),
): RateLimitResult {
  const windowMs = opts.windowMs ?? 10 * 60 * 1000;
  const max = opts.max ?? 5;

  // Periodic global sweep so keys that never come back still get collected.
  if (now - lastSweepAt >= SWEEP_INTERVAL_MS) pruneBuckets(now, windowMs);

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    const oldest = Math.min(...recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  recent.push(now);
  buckets.set(key, recent); // prune-on-access: this key only ever holds in-window timestamps
  return { ok: true };
}

/** Test-only: current number of tracked buckets. */
export function __bucketCount(): number {
  return buckets.size;
}

/** Test-only: clear all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
  lastSweepAt = 0;
}
