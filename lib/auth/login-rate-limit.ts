// Login-attempt throttle (DR-036 §6). Password sign-in is an online-guessing surface, so we
// rate-limit BY PHONE (stops brute-forcing one victim's account → backoff) AND BY IP (blunts
// credential-stuffing from one source), via the shared in-memory limiter. OTP sends have their own
// throttle (otp-rate-limit.ts); this guards the password path. Pure `evaluateLoginAttempt` is
// unit-testable; `checkLoginRate` resolves the request IP.
import { rateLimit } from "../rate-limit";
import { clientIp } from "./otp-rate-limit";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PER_PHONE_MAX = 5; // a real user needs 1–2 tries; 5 then backs off (offer OTP instead)
const PER_IP_MAX = 20; // several users behind one NAT still fine; blunts stuffing

export type LoginRateCheck = { ok: true } | { ok: false; error: string };

/** Pure throttle decision over the shared limiter — testable without a request context. */
export function evaluateLoginAttempt(
  ip: string,
  phone: string,
  now: number = Date.now(),
): LoginRateCheck {
  const byPhone = rateLimit(
    `login:phone:${phone}`,
    { windowMs: WINDOW_MS, max: PER_PHONE_MAX },
    now,
  );
  if (!byPhone.ok)
    return {
      ok: false,
      error:
        "Too many attempts for this number. Wait a few minutes or sign in with OTP.",
    };
  const byIp = rateLimit(
    `login:ip:${ip}`,
    { windowMs: WINDOW_MS, max: PER_IP_MAX },
    now,
  );
  if (!byIp.ok)
    return {
      ok: false,
      error: "Too many login attempts. Please try again in a few minutes.",
    };
  return { ok: true };
}

/** Throttle a password login attempt for `phone` from the current request's IP. Call BEFORE sign-in. */
export async function checkLoginRate(phone: string): Promise<LoginRateCheck> {
  return evaluateLoginAttempt(await clientIp(), phone);
}
