// Player focus-mode route detection (Command_Center_Spec §4.1 · Slice 3, extracted + hardened in
// Slice 5). Pure + unit-tested: ONLY a course-player route (/dashboard/learn/<courseSlug>) gets the
// focused chrome — the in-app Browse and Webinars pages live under the same prefix but are normal
// workspace pages and must NOT lose their sidebar.

/** Static segments under /dashboard/learn/ that are pages, never course slugs. */
export const LEARN_STATIC_SEGMENTS = ["browse", "webinars"] as const;

const PLAYER_ROUTE = new RegExp(
  `^/dashboard/learn/(?!(?:${LEARN_STATIC_SEGMENTS.join("|")})(?:/|$))[^/]+$`,
);

/** True only for /dashboard/learn/<courseSlug> (one segment, not a reserved static page). */
export function isPlayerFocusRoute(pathname: string): boolean {
  return PLAYER_ROUTE.test(pathname);
}
