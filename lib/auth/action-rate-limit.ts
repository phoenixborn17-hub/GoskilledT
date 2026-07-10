// Per-user + per-IP throttle for AUTHENTICATED write actions (launch hardening, Unit 3). Complements
// the OTP/login throttles: it dampens abuse on sensitive authenticated endpoints named in the spec —
// withdraw request, KYC submit, KYC doc-access. This is an ABUSE throttle ONLY: it changes no money
// rule, no ledger, no validation outcome (those stay in the domain). Pure decision over the shared
// limiter; `checkActionRate` resolves the request IP. Fails generic — no enumeration.
import { rateLimit } from "../rate-limit";
import { clientIp } from "./otp-rate-limit";

export type ActionRateCheck = { ok: true } | { ok: false; error: string };

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Pure throttle: per-user (primary) + per-IP (secondary, wider). Testable without a request context. */
export function evaluateActionRate(
  key: string,
  userId: string,
  ip: string,
  max: number,
  now: number = Date.now(),
): ActionRateCheck {
  const byUser = rateLimit(
    `${key}:user:${userId}`,
    { windowMs: WINDOW_MS, max },
    now,
  );
  if (!byUser.ok)
    return {
      ok: false,
      error: "Too many requests. Please wait a few minutes and try again.",
    };
  const byIp = rateLimit(
    `${key}:ip:${ip}`,
    { windowMs: WINDOW_MS, max: max * 3 },
    now,
  );
  if (!byIp.ok)
    return { ok: false, error: "Too many requests. Please try again shortly." };
  return { ok: true };
}

/** Throttle an authenticated write for `userId` from the current request IP. Call BEFORE the domain work. */
export async function checkActionRate(
  key: string,
  userId: string,
  max: number,
): Promise<ActionRateCheck> {
  return evaluateActionRate(key, userId, await clientIp(), max);
}
