// First-touch referral attribution cookie (DR-030 §2 · OPEN-2 RESOLVED: first-touch, 30-day).
// A `?ref=CODE` seen on ANY page (marketing, /register, /login) is captured ONCE by middleware and
// held for 30 days; the FIRST code wins (later ?ref= values never overwrite it). At register/login
// verify we read it back and hand it to `syncUser`, whose first-sync-wins logic + self-referral
// block (lib/auth/user-sync.ts) already enforce the rest. LAUNCH_CONFIG #1: D-01 counsel may refine.
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const REF_COOKIE = "gs_ref";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_LEN = 24;

/** Normalize a raw ?ref= value to the referralCode shape (GS + hex). Junk/empty → null. */
export function sanitizeRefCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return cleaned.length >= 3 && cleaned.length <= MAX_LEN ? cleaned : null;
}

/**
 * Capture first-touch attribution in middleware. Sets the cookie ONLY if a valid ?ref= is present
 * AND no cookie exists yet (first-touch wins). Mutates the passed response's cookies in place.
 */
export function captureRefFromRequest(
  request: NextRequest,
  response: NextResponse,
): void {
  if (request.cookies.get(REF_COOKIE)) return; // already attributed — first touch stays
  const code = sanitizeRefCode(request.nextUrl.searchParams.get("ref"));
  if (!code) return;
  response.cookies.set(REF_COOKIE, code, {
    maxAge: MAX_AGE_SECONDS,
    httpOnly: true, // server-only: only syncUser reads it; no client JS needs it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/** Read the captured referral code in a Server Component / Server Action. */
export async function readRefCookie(): Promise<string | undefined> {
  const store = await cookies();
  return sanitizeRefCode(store.get(REF_COOKIE)?.value) ?? undefined;
}
