# Review Packet — Slice 1 · Home Command Center (Tier B, PARKED)

**Branch:** `gps-cc-home` (off `main@a066a36`) · **Date:** 2026-07-12 · **Status: PARKED — no merge**
**Spec:** `docs/specs/Command_Center_Dashboard_Spec.md` §2 (layout) + §6 Slice-1 (scope) — founder-approved.
**Tier:** B (display/composition only — no money, auth, schema, webhook, or nav-LOGIC change).
**Steward review requested.** Merge only on explicit human-relayed authorization (GATE).

---

## 1 · What changed (by commit)

| Commit    | What                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `85bc9ea` | docs: elevation plan + Command-Center spec (the approved blueprints)                                                                                                                                                                                                                                                                                                                                        |
| `755e89d` | **CC foundations** — `Spark` DOM mark (spark.tsx) · DecisionCard `size="metric"` + `live` prop (label tick → breathing Spark, honest trigger only) · `MetricCard` (thin composition over DecisionCard — NOT a new card system) · `ChartPanel` (DecisionCard-shell analytics panel w/ full-size rich-honest-zero) · `HeatStrip` (7-day heatmap-lite SVG) · `lib/dashboard/activity.ts` (daily lesson series) |
| `1b8f5f1` | **Home rebuild** (§2 bands ①–⑧) — spark-line greeting (priority rules over real state) · 4-card key-metric row w/ 3-way eligibility fork · Continue hero · streamed MomentumBand + ForYouFeed · Store strip demoted to band ⑦ · AnnouncementBanner `storageKey` (dismiss-and-STAYS) · `lib/home/{summary,momentum,feed}.ts` composite loaders                                                               |
| `12a9223` | **Hybrid shell chrome** (§1.2 R2/R3) — `SidebarSnapshot` replaces the sidebar-header label (kills triple-label) · honest Spark switcher pip (streak-at-risk → Learn, inactive workspaces only, sr-only text) · `lib/nav/shell-state.ts` server loader wired in the dashboard layout                                                                                                                         |
| `b7e91f0` | Design-system "Command Center" section — MetricCard ThreeStates + all 3 eligibility forks side-by-side, ChartPanel ready/honest-zero, Spark, SidebarSnapshot · prettier pass                                                                                                                                                                                                                                |

**Diffstat:** 21 files, +2,210 / −212 (≈800 of the + is the two docs). Full file list = the Slice-1 file set from spec §6 only; no other surface touched.

## 2 · Eligibility-fork + honesty checklist (HARD LOCKS)

- [x] **Fork 1 — earn hidden (DR-040):** `EarnMetric.kind="hidden"` → slot 4 becomes Next-webinar / Next-milestone (learning-first); no earn data is even _fetched_; Share/QuickAction/referral step already gated (unchanged). Zero earn trace on Home.
- [x] **Fork 2 — visible, NOT eligible (DR-038):** `kind="network"` → people-not-money card ("Your network · 0 · See how earning works") — **no ₹ anywhere**, CTA lands on the Earn hub's existing eligibility fork. **Live-verified server-render** (test user): `Your network 0 · See how earning works.`
- [x] **Fork 3 — eligible (DR-043):** `kind="recorded"` → label **"Recorded earnings"**, caption _"Recorded to your wallet — payouts open at launch"_ while D-01 closed; "Available" badge only when payouts ON **and** available > 0; **never "ready to withdraw"**, no projection.
- [x] Fork resolved by the EXISTING server predicates (`isFeatureVisible("earn")`, `isEligibleToEarn`, `payoutsEnabled`) — no eligibility logic re-implemented.
- [x] **Money:** paise end-to-end; display only via `safeMoney`/`DataValue` (never ₹0-on-fail) or guarded `formatINRFromPaise` (sidebar snapshot: omitted unless finite); `.dc-number` tabular; **no count-up/animation on money**; gold decorative, figures charcoal.
- [x] **D-29:** spark line = first matching REAL lifecycle rule, absent states never mentioned; AI-line prop unused (no real trigger source yet); feed = real events only (lesson/certificate/L1-join); momentum charts render only when the real series is non-zero, else the honest unlock shell; Spark `live` edges fire only on real triggers (learned-today, streak alive).
- [x] **ThreeState:** every metric card defines New (honest zero + unlock micro-line) / Active (real delta) / Power (best-streak, held-clearing captions); charts have full-size unlock shells (never a shrunken box); getting-started strip = ONE element above the full dashboard.
- [x] **Nav v1.1 byte-identical in structure:** `lib/nav/workspaces.ts` untouched; no route/item/href changed; AppShell additions are presentation-only optional props.
- [x] **A11y (AA):** whole-card links w/ focus rings inherited from DecisionCard; HeatStrip/ring/charts carry aria-labels + sr-only data summaries; Spark is `aria-hidden` with its meaning duplicated as text (sr-only "— new activity" on pips); color never sole signal.
- [x] **Motion:** all new motion = existing `.dc-spark-halo`/`.dc-enter` primitives (already `prefers-reduced-motion`-gated + device-tiered in globals.css); zero new CSS animation added.

## 3 · Tests / green checklist

- `tsc --noEmit` — clean · `eslint` (slice paths) — clean · `prettier` — applied.
- `npm test` — **470 passed / 4 skipped**; 1 integration FILE (`money-flow.integration.test.ts`) flaked during the parallel full-suite run (setup `prisma.user.create` against the shared live Supabase) and **passes 4/4 standalone on immediate re-run** — transient DB contention, not a regression (slice touches no money path).
- `next build` — **green** (compiled + types + lint; page-data collection run under the sanctioned staging escape (`APP_ENV=staging` + non-prod host) because local `.env` has mock providers — same guard behavior as before the slice).

## 4 · Render notes (screenshots unavailable — environment, see caveat)

Server-rendered `/dashboard/home` verified end-to-end via the running dev server (fetched document, full stream, clean `</html>`):

- ① `Namaste, Ashish` + Founding Batch + Spark-bulleted line "Your first lesson is 2 minutes away."
- ② Metric row: `Progress 0% · Lesson 1 unlocks your analytics` / `Streak 0 days · Complete a lesson today…` / `Certificates 0 · Your first seal awaits` / **`Your network 0 · See how earning works`** (fork 2, no ₹) — rich-honest-zero, all four present.
- Getting-started strip (new user) → ③ "Pick your first course" hero → ④ "Your momentum · Learning activity · Last 14 days" (real 1-lesson series + sr summary) → ⑤ "For you today · Lesson completed · 8d ago" (real event) → ⑥ Jump back in → ⑦ **Browse the Store (demoted)** → ⑧ Announcement + Share.
- Sidebar header shows the snapshot ("Start your first course · 2 minutes to your first win") instead of a third "Learn"/"Home" label — triple-label killed.
- `/design-system` → "Command Center — MetricCards (Slice 1 · ThreeState)" section renders both state rows + all three slot-4 forks side by side + ChartPanel ready/zero + Spark + SidebarSnapshot samples.

**Environment caveat (not a slice defect):** in this session's embedded browser pane, screenshots timed out on EVERY page (including the pre-existing login page, before any slice code), and streamed Suspense boundaries never resolved client-side — **reproduced identically on unmodified `main`** (baseline test: checked out main's layout/shell/home, same stall, then restored). Server output is complete and correct in both cases. Visual/screenshot pass should happen on staging after merge (staging already runs this exact streaming pattern from the old Home).

## 5 · Perf note

- First viewport = ONE composed server payload (`getHomeSummary`): +3 cheap reads vs before (certificate count, 7-day activity, eligibility branch) — the earn branch fetches wallet OR tree only for the branch the viewer may see. Momentum/feed/workspaces stream behind Suspense with zero-CLS skeletons (unchanged pattern).
- Layout adds `getShellState` (enrolled + gamification + earn branch) — runs on hard loads only (App Router layouts persist across client navigation). Snapshot may be a click stale after in-app progress: accepted, same as the money-staleness precedent (Phase 6).
- Zero new client JS libraries; HeatStrip/Spark are inline SVG/DOM; charts remain inline-SVG `AreaChart`; no new fonts; no new infinite animations (Spark reuses `.dc-spark-halo`).

## 6 · Known limitations / follow-ups (not blockers)

1. **Earn switcher pip** has no honest trigger pre-D-01 (no HELD→AVAILABLE event surface) — mechanism shipped, Learn (streak-at-risk) is the only wired trigger. Wire the Earn trigger with the Slice-4 wallet clearing work.
2. Fork 3 ("Recorded earnings") and fork 1 (earn hidden) verified structurally + in the design-system showcase; no eligible/flag-off user exists in the local shared DB to live-render them end-to-end. The kind is produced directly by the existing leak-tested predicates.
3. Feed counts free-preview lesson completions ("Lesson completed · 8d ago") while the greeting can still say "first lesson" (lifecycleNew = no ENROLLED progress — pre-existing semantics). Cosmetic tension; candidate one-liner for the steward to rule on.
4. `lib/learn/dashboard.ts` still has its own copy of the 14-day activity loop (left untouched — out of Slice-1 file set); dedupe onto `lib/dashboard/activity.ts` during the Slice-2 sweep.
5. Wallet-metric card intentionally has no mini-chart (momentum band owns the earn trend) — spec §2.4 allows per-slot viz choice.

## 7 · Self-assessment (5 lines)

Built exactly the §6 Slice-1 scope on the existing DecisionCard system — the one genuinely new primitive is a 47-line SVG heat strip; everything else composes what the repo already owned. The three-way eligibility fork is structural (a discriminated union produced by the existing server predicates), so a non-eligible user _cannot_ receive rupee data in the payload, not merely not render it. Honesty rules (D-29/DR-043/D-01) are encoded in copy branches next to the data they describe, with the strictest branch as default. Biggest residual risk: visual polish is verified by server-render text + the design-system showcase, not pixels, because this session's browser pane could not screenshot ANY page (fails identically on unmodified main) — a staging visual pass is the right follow-up. No money/auth/nav logic moved; the slice is byte-reversible by dropping the branch.

**PARKED on `gps-cc-home` — awaiting steward Tier-B review + explicit merge authorization.**
