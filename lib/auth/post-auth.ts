// Single source of truth for where a user lands after authentication (Phase A §4.5 — the founder's
// headline broken-flow fix). New accounts (never saw /welcome) → the one-time welcome moment;
// everyone else → the Hub. Applied identically after register-verify, password login, OTP login and
// checkout-onboarding so the "Get-Started → welcome → dashboard" journey has ZERO dead ends.
import { prisma } from "../prisma";

const WELCOME = "/welcome";
// Returning users land on the Home hub (DR-039). New accounts still get the one-time /welcome
// moment first (welcomeSeenAt branch below) → welcome → Lesson 0 is preserved unchanged.
const DASHBOARD = "/dashboard/home";

/** Only same-origin absolute paths are honoured as a post-login `next` (blocks open-redirects). */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  // Must be a root-relative path and NOT a protocol-relative "//host" escape.
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** The canonical post-auth destination for a synced internal user id. */
export async function postAuthRedirect(
  userId: string,
  next?: string | null,
): Promise<string> {
  const safe = safeNext(next);
  if (safe) return safe; // honour an explicit, validated deep-link (e.g. a bounced /dashboard/xyz)
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { welcomeSeenAt: true },
  });
  return u?.welcomeSeenAt ? DASHBOARD : WELCOME;
}
