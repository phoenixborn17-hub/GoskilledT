// Abuse throttle for the anonymous /api/referral/click endpoint (Feature Batch v1.0 §3). The 24h
// (code, visitorId) dedup already caps repeat inserts per visitor per code; this guards against a
// single source minting many distinct visitorIds to spam rows. IP is used ONLY as a rate-limit key
// (never persisted — the ReferralClick row itself stores no IP, per spec).
import { rateLimit } from "../rate-limit";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PER_IP_MAX = 60; // generous — a real visitor clicking a few links in 10 min is normal

export type ReferralClickRateCheck = { ok: true } | { ok: false };

/** Pure throttle decision — testable without a request context. */
export function evaluateReferralClickRate(
  ip: string,
  now: number = Date.now(),
): ReferralClickRateCheck {
  const result = rateLimit(
    `referral-click:ip:${ip}`,
    { windowMs: WINDOW_MS, max: PER_IP_MAX },
    now,
  );
  return result.ok ? { ok: true } : { ok: false };
}
