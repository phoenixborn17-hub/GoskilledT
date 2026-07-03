// Minimal in-memory per-key rate limiter for public write endpoints (Ticket 6).
// TECH DEBT: in-memory = per-process only; resets on deploy and doesn't span instances.
// Fine for launch abuse-dampening; swap for Redis/Upstash when we scale horizontally.

/** Pure, testable core: is a new request allowed given prior timestamps in the window? */
export function withinLimit(timestamps: number[], now: number, windowMs: number, max: number): boolean {
  const recent = timestamps.filter((t) => now - t < windowMs);
  return recent.length < max;
}

const buckets = new Map<string, number[]>();

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
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    const oldest = Math.min(...recent);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}

/** Test-only: clear all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
}
