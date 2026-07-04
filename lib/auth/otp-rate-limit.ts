// OTP-send throttle (GPS-M4 carried ticket · LAUNCH_CONFIG #21). Every Supabase OTP send costs
// an SMS and is an abuse surface (enumeration / bill-run). We rate-limit BOTH by client IP (blunts
// bulk abuse from one source) AND by phone number (stops hammering a single victim's inbox), via
// the shared in-memory limiter. Applied on every send path: login + checkout (+ register once that
// path lands on main). Pure `evaluateOtpSend` is unit-testable; `checkOtpSendRate` resolves the IP.
import { headers } from "next/headers";
import { rateLimit } from "../rate-limit";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PER_IP_MAX = 8; // several users behind one NAT still fine; blunts bulk enumeration
const PER_PHONE_MAX = 4; // a real user needs 1–2 sends; 4 covers legit resends

export type OtpRateCheck = { ok: true } | { ok: false; error: string };

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

/** Pure throttle decision over the shared limiter — testable without a request context. */
export function evaluateOtpSend(
  ip: string,
  phone: string,
  now: number = Date.now(),
): OtpRateCheck {
  const byIp = rateLimit(
    `otp-send:ip:${ip}`,
    { windowMs: WINDOW_MS, max: PER_IP_MAX },
    now,
  );
  if (!byIp.ok)
    return {
      ok: false,
      error: "Too many OTP requests. Please try again in a few minutes.",
    };
  const byPhone = rateLimit(
    `otp-send:phone:${phone}`,
    { windowMs: WINDOW_MS, max: PER_PHONE_MAX },
    now,
  );
  if (!byPhone.ok)
    return {
      ok: false,
      error:
        "Too many OTP requests for this number. Please wait a few minutes.",
    };
  return { ok: true };
}

/** Throttle an OTP send for `phone` from the current request's IP. Call BEFORE provider.sendOtp. */
export async function checkOtpSendRate(phone: string): Promise<OtpRateCheck> {
  return evaluateOtpSend(await clientIp(), phone);
}
