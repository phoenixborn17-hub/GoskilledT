// GPS-M5 §2.4 (Fable Tier-A condition 3) — HMAC-signed unsubscribe token. The emailed link carries
// `?u=<userId>&sig=<hmac>`; a tampered/missing sig is rejected, so one learner can't unsubscribe
// another (and scanners can't forge opt-outs). Pure sign/verify (secret injected) → fully testable.
import { createHmac, timingSafeEqual } from "node:crypto";

/** PURE: HMAC-SHA256(userId) → short base64url tag. */
export function signUnsubscribe(userId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(userId)
    .digest("base64url")
    .slice(0, 24);
}

/** PURE: constant-time verification of an unsubscribe signature. */
export function verifyUnsubscribe(
  userId: string,
  sig: string,
  secret: string,
): boolean {
  if (!sig || !secret) return false;
  const expected = signUnsubscribe(userId, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Signing key for unsubscribe links. Production MUST set a dedicated `EMAIL_UNSUBSCRIBE_SECRET`
 * (also enforced at boot by env validation) — we throw fast rather than silently derive a key, so a
 * misconfigured prod deploy can never sign links with a rotate-prone secret or an empty string.
 * Dev/test may derive from `DATABASE_URL` (an existing local secret) so a laptop boots without extra
 * config; no hardcoded secret ever lives in code (Golden Rule 5).
 */
export function unsubscribeKey(): string {
  const dedicated = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EMAIL_UNSUBSCRIBE_SECRET is required in production (unsubscribe-link HMAC key).",
    );
  }
  const devFallback = process.env.DATABASE_URL;
  if (!devFallback) {
    throw new Error(
      "No unsubscribe key available: set EMAIL_UNSUBSCRIBE_SECRET (or DATABASE_URL in dev).",
    );
  }
  return devFallback;
}
