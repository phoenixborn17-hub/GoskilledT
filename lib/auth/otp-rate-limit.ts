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

// A-2: throttle OTP *verify* attempts too (defence-in-depth against online brute-force of the 4–6
// digit code). Supabase has its own attempt limits; this adds an app-level backstop. Slightly more
// generous than send, since a code arrives once and a user may fat-finger it a couple of times.
const VERIFY_PER_IP_MAX = 15;
const VERIFY_PER_PHONE_MAX = 6;

/** Pure throttle decision for an OTP verify attempt — testable without a request context. */
export function evaluateOtpVerify(
  ip: string,
  phone: string,
  now: number = Date.now(),
): OtpRateCheck {
  const byPhone = rateLimit(
    `otp-verify:phone:${phone}`,
    { windowMs: WINDOW_MS, max: VERIFY_PER_PHONE_MAX },
    now,
  );
  if (!byPhone.ok)
    return {
      ok: false,
      error: "Too many attempts for this number. Please wait a few minutes.",
    };
  const byIp = rateLimit(
    `otp-verify:ip:${ip}`,
    { windowMs: WINDOW_MS, max: VERIFY_PER_IP_MAX },
    now,
  );
  if (!byIp.ok)
    return {
      ok: false,
      error: "Too many attempts. Please try again in a few minutes.",
    };
  return { ok: true };
}

/** Throttle an OTP verify for `phone` from the current request's IP. Call BEFORE provider.verifyOtp. */
export async function checkOtpVerifyRate(phone: string): Promise<OtpRateCheck> {
  return evaluateOtpVerify(await clientIp(), phone);
}
