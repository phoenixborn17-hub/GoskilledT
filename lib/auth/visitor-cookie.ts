// First-party visitor-ID cookie for referral CLICK tracking (Feature Batch v1.0 §3). Deliberately
// separate from the `gs_ref` first-touch attribution cookie (lib/auth/ref-cookie.ts): visitorId
// identifies the browser, not the referral code it saw, and is used ONLY to dedupe click rows
// (code, visitorId) within a 24h window — no PII, no IP, no user-agent ever stored alongside it.
import type { NextRequest, NextResponse } from "next/server";

export const VISITOR_COOKIE = "gs_vid";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year — a stable per-browser id, not an attribution window

/** UUID v4 shape check — the only validation a client-supplied visitorId gets before use as a DB key. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidVisitorId(v: string | null | undefined): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/**
 * Read the visitorId from the request, or mint a fresh one and set it on the response. Returns
 * the id to use for THIS request either way. Edge-safe (Web Crypto `randomUUID`, no Node APIs).
 */
export function ensureVisitorId(
  request: NextRequest,
  response: NextResponse,
): string {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  if (isValidVisitorId(existing)) return existing;

  const fresh = crypto.randomUUID();
  response.cookies.set(VISITOR_COOKIE, fresh, {
    maxAge: MAX_AGE_SECONDS,
    httpOnly: true, // server-only: no client JS needs it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return fresh;
}
