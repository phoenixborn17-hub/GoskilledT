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
 * Signing key. Prefer a dedicated secret; else derive from an existing REQUIRED server secret
 * (DATABASE_URL) — no hardcoded fallback in code (Golden Rule 5). Rotating the source silently
 * invalidates outstanding links, which is acceptable for a transient unsubscribe token.
 */
export function unsubscribeKey(): string {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.DATABASE_URL || "";
}
