// Route protection + RBAC (Ticket 3, Task 4) and Supabase session refresh.
//   /dashboard/*  → any authenticated user
//   /admin/*      → app_metadata.role === "admin" (set via SQL, see SETUP.md)
// Importing the providers config runs the production safety guard at startup.
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import "./lib/config/providers";

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  if (path === "/login") url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !user) {
    return redirectTo(request, "/login");
  }

  if (path.startsWith("/admin")) {
    if (!user) return redirectTo(request, "/login");
    const role = (user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "admin") return redirectTo(request, "/"); // not an admin → bounce home
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
