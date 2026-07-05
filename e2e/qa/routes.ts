// QA-01 route manifest — the authoritative list of every app route the screenshot harness
// captures. One entry per route. `states` declares which of default/empty/loading/error are
// *distinct and reachable* for that route (we never fabricate a state that doesn't exist).
//
// Dynamic segments are written as `:fixtureKey` and resolved at runtime from e2e/.auth/
// fixtures.json (produced by scripts/qa-auth-bootstrap.ts). An "error" variant supplies its own
// concrete path (a deliberately invalid param) so we can screenshot the not-found/invalid state.
//
// `register` is the DESIGN_DIRECTION Part B design register (Consumer / Trust / Admin) — recorded
// for the index only; the harness applies NO UX judgement, just the mechanical budgets.

export type Auth = "none" | "user" | "admin";
export type Register = "Consumer" | "Trust" | "Admin";
export type StateName = "default" | "empty" | "loading" | "error";

export interface RouteDef {
  /** Path template; `:key` segments resolved from fixtures.json. */
  path: string;
  /** Session the harness loads before navigating. */
  auth: Auth;
  /** DESIGN_DIRECTION Part B register (documentation only). */
  register: Register;
  /** Human label used in filenames + the index. */
  id: string;
  /** States to capture. `default` always present. */
  states: StateName[];
  /**
   * For a route whose *natural* default is already an empty state (fresh QA user has no data),
   * mark true so the index reports the default shot as covering `empty` too — no second shot.
   */
  defaultIsEmpty?: boolean;
  /** Concrete invalid path for the `error` state (overrides `path` when state === "error"). */
  errorPath?: string;
  /** Optional query string appended to `path` (e.g. checkout package). */
  query?: string;
  /** Note surfaced in the index (e.g. why a state is skipped). */
  note?: string;
}

// ── Public marketing + legal + auth-entry (no session) ────────────────────────────────────────
const PUBLIC: RouteDef[] = [
  {
    id: "home",
    path: "/",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "about",
    path: "/about",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "contact",
    path: "/contact",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "courses",
    path: "/courses",
    auth: "none",
    register: "Consumer",
    states: ["default", "loading"],
  },
  {
    id: "course-detail",
    path: "/courses/:courseSlug",
    auth: "none",
    register: "Consumer",
    states: ["default", "loading", "error"],
    errorPath: "/courses/no-such-course",
  },
  {
    id: "packages",
    path: "/packages",
    auth: "none",
    register: "Consumer",
    states: ["default", "loading"],
  },
  {
    id: "webinar",
    path: "/webinar",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "earn-public",
    path: "/earn",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "blog",
    path: "/blog",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "videos",
    path: "/videos",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "faq",
    path: "/faq",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "login",
    path: "/login",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "register",
    path: "/register",
    auth: "none",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "checkout",
    path: "/checkout",
    auth: "none",
    register: "Trust",
    query: "package=career-booster",
    states: ["default"],
  },
  {
    id: "disclaimer",
    path: "/disclaimer",
    auth: "none",
    register: "Trust",
    states: ["default"],
  },
  {
    id: "privacy",
    path: "/privacy",
    auth: "none",
    register: "Trust",
    states: ["default"],
  },
  {
    id: "terms",
    path: "/terms",
    auth: "none",
    register: "Trust",
    states: ["default"],
  },
  {
    id: "refund-policy",
    path: "/refund-policy",
    auth: "none",
    register: "Trust",
    states: ["default"],
  },
  {
    id: "verify",
    path: "/verify/:verifySerial",
    auth: "none",
    register: "Trust",
    states: ["default", "error"],
    errorPath: "/verify/GS-NOT-A-REAL-SERIAL",
    note: "default = valid cert if a serial fixture exists; else only the error (not-found) variant is captured.",
  },
];

// ── Authenticated learner surfaces (QA user session — fresh account = genuine empty states) ─────
const USER: RouteDef[] = [
  {
    id: "welcome",
    path: "/welcome",
    auth: "user",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "onboarding",
    path: "/onboarding",
    auth: "user",
    register: "Consumer",
    states: ["default"],
  },
  {
    id: "dashboard",
    path: "/dashboard",
    auth: "user",
    register: "Consumer",
    states: ["default", "loading"],
    defaultIsEmpty: true,
  },
  {
    id: "dashboard-courses",
    path: "/dashboard/courses",
    auth: "user",
    register: "Consumer",
    states: ["default", "loading"],
    defaultIsEmpty: true,
  },
  {
    id: "dashboard-learn",
    path: "/dashboard/learn",
    auth: "user",
    register: "Consumer",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "course-player",
    path: "/dashboard/learn/:courseSlug",
    auth: "user",
    register: "Consumer",
    states: ["default", "loading"],
    note: "Unenrolled QA user → free-preview lesson plays, rest locked (server-gated).",
  },
  {
    id: "dashboard-progress",
    path: "/dashboard/progress",
    auth: "user",
    register: "Consumer",
    states: ["default", "loading"],
    defaultIsEmpty: true,
  },
  {
    id: "profile",
    path: "/dashboard/profile",
    auth: "user",
    register: "Trust",
    states: ["default", "loading"],
  },
  {
    id: "earn-hub",
    path: "/dashboard/earn",
    auth: "user",
    register: "Consumer",
    states: ["default", "loading"],
    defaultIsEmpty: true,
  },
  {
    id: "earn-commissions",
    path: "/dashboard/earn/commissions",
    auth: "user",
    register: "Trust",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "earn-referrals",
    path: "/dashboard/earn/referrals",
    auth: "user",
    register: "Consumer",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "earn-wallet",
    path: "/dashboard/earn/wallet",
    auth: "user",
    register: "Trust",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "earn-kyc",
    path: "/dashboard/earn/kyc",
    auth: "user",
    register: "Trust",
    states: ["default"],
    defaultIsEmpty: true,
  },
];

// ── Admin workspace (QA admin session — role minted via SQL) ─────────────────────────────────
const ADMIN: RouteDef[] = [
  {
    id: "admin-home",
    path: "/admin",
    auth: "admin",
    register: "Admin",
    states: ["default", "loading"],
  },
  {
    id: "admin-leads",
    path: "/admin/leads",
    auth: "admin",
    register: "Admin",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "admin-payments",
    path: "/admin/payments",
    auth: "admin",
    register: "Admin",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "admin-review-queue",
    path: "/admin/review-queue",
    auth: "admin",
    register: "Admin",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "admin-users",
    path: "/admin/users",
    auth: "admin",
    register: "Admin",
    states: ["default"],
  },
  {
    id: "admin-audit",
    path: "/admin/audit",
    auth: "admin",
    register: "Admin",
    states: ["default"],
  },
  {
    id: "admin-catalog",
    path: "/admin/catalog",
    auth: "admin",
    register: "Admin",
    states: ["default"],
  },
  {
    id: "admin-catalog-detail",
    path: "/admin/catalog/:adminCourseId",
    auth: "admin",
    register: "Admin",
    states: ["default", "error"],
    errorPath: "/admin/catalog/no-such-course-id",
  },
  {
    id: "admin-kyc",
    path: "/admin/kyc",
    auth: "admin",
    register: "Admin",
    states: ["default"],
    defaultIsEmpty: true,
  },
  {
    id: "admin-kyc-detail",
    path: "/admin/kyc/:kycUserId",
    auth: "admin",
    register: "Admin",
    states: ["default", "error"],
    errorPath: "/admin/kyc/no-such-user-id",
    note: "default only captured if a KYC submission fixture exists.",
  },
  {
    id: "admin-settings",
    path: "/admin/settings",
    auth: "admin",
    register: "Admin",
    states: ["default"],
  },
  {
    id: "admin-webinar",
    path: "/admin/webinar",
    auth: "admin",
    register: "Admin",
    states: ["default"],
  },
  {
    id: "admin-withdrawals",
    path: "/admin/withdrawals",
    auth: "admin",
    register: "Admin",
    states: ["default"],
    defaultIsEmpty: true,
  },
];

export const ROUTES: RouteDef[] = [...PUBLIC, ...USER, ...ADMIN];

/** The three viewport widths QA-01 captures at (heights are generous; full-page shots anyway). */
export const WIDTHS = [360, 768, 1280] as const;
export type Width = (typeof WIDTHS)[number];
