// Route protection + RBAC (Ticket 3, Task 4) and Supabase session refresh.
//   /dashboard/*  → any authenticated user
//   /admin/*      → app_metadata.role === "admin" (set via SQL, see SETUP.md)
// Importing the providers config runs the production safety guard at startup.
import { type NextRequest, type NextFetchEvent, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { captureRefFromRequest, sanitizeRefCode } from "./lib/auth/ref-cookie";
import { ensureVisitorId } from "./lib/auth/visitor-cookie";
import "./lib/config/providers";

function redirectTo(
  request: NextRequest,
  path: string,
  base?: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  if (path === "/login") url.searchParams.set("next", request.nextUrl.pathname);
  const redirect = NextResponse.redirect(url);
  // Carry over any cookies set on the base response (session refresh + first-touch ref) so a
  // redirect never drops them.
  base?.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { response, user, authUnavailable } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // First-touch referral capture (DR-030 §2). Runs on every matched route so a ?ref= on ANY
  // page (marketing, /register, /login) is attributed once. Set on `response` so redirects below
  // (which return their own response) don't drop it — capture BEFORE any early return.
  captureRefFromRequest(request, response);

  // Referral CLICK tracking (Feature Batch v1.0 §3) — separate from the first-touch attribution
  // above: fires on EVERY ?ref= hit (not gated by whether gs_ref is already set), deduped server-
  // side by (code, visitorId) within 24h. Edge middleware can't reach Postgres directly, so this
  // hands off to a Node.js route handler via a non-blocking fetch kept alive by event.waitUntil()
  // — never awaited inline, never blocks or slows the response.
  const clickCode = sanitizeRefCode(request.nextUrl.searchParams.get("ref"));
  if (clickCode) {
    const visitorId = ensureVisitorId(request, response);
    event.waitUntil(
      fetch(new URL("/api/referral/click", request.nextUrl.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clickCode, visitorId }),
      }).catch(() => {
        /* best-effort analytics — a failed click log never affects the request */
      }),
    );
  }

  // Supabase couldn't be reached to verify the token — this is NOT the same as "no session"
  // (2026-07-15 login-bounce fix). Let the request through rather than bounce a real session to
  // /login; the dashboard/admin layout re-verifies and shows a retry screen if still down.
  if (authUnavailable) return response;

  if (path.startsWith("/dashboard") && !user) {
    return redirectTo(request, "/login", response);
  }

  if (path.startsWith("/admin")) {
    if (!user) return redirectTo(request, "/login", response);
    const role = (user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "admin") return redirectTo(request, "/", response); // not an admin → bounce home
  }

  return response;
}

export const config = {
  // Run on everything except static assets AND the Razorpay webhook (raw-body signed route
  // that must never pass through session/auth machinery — Ticket 3 deferred finding).
  matcher: [
    "/((?!api/webhooks/razorpay|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
