# Review Packet — Phase 2: App Shell + Home Hub (Redesign U2–U3)

- **Branch:** `gps-decision-cards` (continues on Phase-1 + pass-2 cards) · **Commit:** `4b22f91`.
- **Tier:** B (shell + composite Home; no money/PII/architecture change). **GATE: PARKED — not merged. `main` untouched.**
- **Read:** Dashboard_Redesign_v3.0 §1–2 · IA v2.0 §1/§12 (naming via Amendments §A) · Amendments §E (DR-040 nav) / §F (Home payload) · DecisionCard System + Pass 2.

Phase 2 delivers the navigation frame and the composite Home hub, **wrapping the existing app** — no route or business-logic change, money math untouched, payouts OFF.

## U2 — App shell (IA v2.0 naming)

`components/nav/app-shell.tsx` + `lib/nav/workspaces.ts` (config) + `lib/feature-visibility/index.ts` (stub).

- **Left sidebar** with the **6 IA v2.0 workspaces**: **Home · Learn · Earn · Explore · Guru AI · Account** (Explore **not** Marketplace; Guru AI = its own workspace; Account split — Amendments §A). A **workspace switcher** themes the subtree via `[data-theme]` (neutral Home / green Learn / gold Earn) and always shows the active surface; below it, the active workspace's **contextual sub-nav**; a **persistent Share** footer (DR-039).
- **Top bar**: workspace title · **Guru floating entry** (every surface) · notifications bell · profile menu (real `signOutAction`).
- **Mobile**: hamburger → **drawer** (full nav) + **4-item bottom bar (Home · Learn · Earn · Share)**; Share opens a bottom sheet with the ShareWidget.
- **Real routes only** — every href points at an already-built page; sub-pages that don't exist yet are simply not listed (no dead links, D-29). **Guru** has no route → opens a panel (full chat is Phase 5). **Feature-Visibility** nav recomposition is a **hook stub** (`isFeatureVisible` → all visible; Phase 7 wires the resolver + hides the Affiliate workspace with graceful recomposition).
- **Wraps the app** via `app/dashboard/layout.tsx` (replaced `DashboardNav` with `AppShell`) — presentation only; existing pages untouched.

## U3 — Home hub (COMPOSITE)

`app/dashboard/home/page.tsx` + `lib/home/summary.ts` + `components/home/enter-workspaces.tsx`.

- **Reads existing data only** — `getHomeSummary` composes existing accessors (`getEnrolledCourses`, `getGamification`, `getNextWebinar`, referral tree) — **no new money/business logic**. Wallet-available is a real ledger read **gated on the payout flag AND > 0** → pre-D-01 it's simply absent (no ₹ on Day-0, honest).
- **Composed first-viewport payload** (greeting + Today's Summary + primary CTA) renders server-side; **Enter-Workspace snapshots stream** below via `<Suspense>` with a zero-CLS skeleton (Amendments §F).
- **Sections**: dynamic greeting (real state) · Today's Summary (next lesson · today's webinar · streak · wallet-if-eligible — each a Decision Card tap target) · contextual **Quick Actions (≤4, rules-driven)** · **priority notifications (rules over real state only)** · **Enter-Workspace cards** (Learning + Affiliate, each carrying its real snapshot) · announcements (truthful static fallback, admin CMS = Phase F-Admin) · Share.
- **Zero-data → getting-started** (never empty widgets, D-29). Built on the Decision Card system.

## Verification

```
tsc --noEmit → 0 · prettier → clean · eslint (new files) → 0/0
vitest --exclude integration           → 49 files, 373 passed
money non-regression subset            → 25 passed
  (money-flow · earning-gate/clawback/idempotency · hold-clawback · refund-mirror · commission)
```

**Browser (next-dev, authenticated):** no console errors.

- **Shell** — sidebar shows all 6 workspaces; topbar title tracks the workspace; profile/Guru/bell present.
- **Theme switch** — `/dashboard/home` → `data-theme="neutral"`; `/dashboard/earn` → `data-theme="earn"` (gold). The existing earn page renders intact inside the shell.
- **Home hub** — new user (no progress) correctly hits the **honest zero-data getting-started path** (greeting + 3-step checklist + Share), not empty widgets. Screenshot captured.
- **Mobile** — bottom bar = Home · Learn · Earn · Share; sidebar hidden; hamburger opens the drawer.

_(The rich Today's-Summary bento — Continue hero + streak/webinar/wallet Decision Cards — renders for a user WITH learning progress; the test account is a fresh user, so the zero-data path showed. Both paths are implemented + type-checked.)_

## Locks held

Re-skin-in-place (shell wraps; no route/logic edits) · money math untouched · payouts OFF (no ₹ pre-D-01) · D-29 honest states (zero-data getting-started; rules-only notifications; truthful announcement) · device-tiered (Decision Cards) · WCAG (labelled controls, focus rings, ≥44px targets) · zero money non-regression.

## Notes / follow-ups (not blockers)

- **Landing redirect unchanged** — post-auth still lands on `/dashboard` (existing logic + tests). The Home hub is `/dashboard/home` and is the nav "Home" destination; making it the landing is a small redirect change deferred to avoid touching tested auth logic (founder call).
- **Earn sub-nav duplication** — the shell's Earn sub-nav + the existing earn page's own tab bar both show (Phase 4 re-skins Earn and removes the old tabs). Harmless now.
- **Guru** = panel stub (Phase 5 full chat). **Notifications bell** = entry only (feed is Phase 7/§8). **Feature-Visibility** = hook stub (Phase 7).
- **Perf** — Home first-viewport is a composed server payload + streamed below-fold; formal <2s throttled budget-Android recapture is prod-build work (Phase 6).

## Self-assessment

1. Shell built to IA v2.0 naming (Explore/Guru-workspace/Account-split) with a working themed workspace switcher; wraps the app with zero route/logic change.
2. Home hub is a true composite over existing accessors — first-viewport payload + streamed snapshots (§F); zero-data honest path verified live.
3. All locks held; money untouched (25 money tests green); no ₹ on Day-0 (wallet flag-gated).
4. Green everywhere (tsc/lint/prettier; 373 + 25 tests); no console errors in the browser.
5. Parked for review — no merge sought; next = Phase 3 (Learn workspace) after review + authorization.
