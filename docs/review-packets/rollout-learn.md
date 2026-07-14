# Review Packet — Vibrant Rollout · Slice B: Learn Dashboard (Tier B, PARKED)

**Branch:** `gps-rollout-learn` (off `main@39cc847`) · **Date:** 2026-07-15 · **Status: PARKED — no merge**
**Directive:** founder-locked v5 rollout, Slice B (Learn workspace).
**Spec:** `docs/specs/Vibrant_CardSystem_Amendment_v1.0.md` §5 (rollout state — Slice B) ·
`docs/specs/Command_Center_Dashboard_Spec.md` §1.3 (hybrid contract: Learn stays a focused-depth
workspace, never a second command center).
**Tier:** B — display re-skin, composition only; zero data/money/eligibility/nav logic change.
**Steward review requested**; merge only on explicit authorization (GATE).

---

## 1 · What changed

| File | What |
|---|---|
| `app/dashboard/learn/page.tsx` | Header replaced with the `vh-hero` band (greeting + Spark subline + real streak/progress glance chips, same recipe as Home's command header). The 4 `StatCard`s replaced with 4 `VibrantMetricCard`s on de-clustered accents: cyan **Courses** · bold-emerald **Progress** (focal, `AnimatedRing`+`CountUp`) · purple **Certificates** · orange **Streak** (`HeatStrip`). Continue hero, Overview/Activity tabs, course cards, recommendations, webinar row, quick actions, getting-started strip **all left on the existing dc-recipe** — same restraint Home Slice A used for its non-hero bands. |
| `lib/learn/dashboard.ts` | Additive fields only: `streakDetail` (`current/atRisk/longest`, same `game.streak` object already fetched), `last7` (slice of the existing 14-day `weeklyActivity`), `weekLessons` (its sum). No new queries, no changed queries, no removed fields. |

**Diffstat:** 2 files, +167/−62 (page.tsx net larger due to the metric-row JSX; no other files touched).

## 2 · Honesty checklist (HARD LOCKS)

- [x] **No money on this surface** — Learn has no earn-fork; the "Refer a friend" quick action is
      the only affiliate-adjacent element and its `isFeatureVisible("earn")` gate is byte-identical.
- [x] **`git diff main...HEAD -- lib modules`** shows only the three additive fields above, all
      derived from the same `game`/`weeklyActivity` values `getLearnDashboard` already computed —
      no new business logic, no touched money/eligibility/nav code.
- [x] **Honest-zero (ThreeState law)** — every metric card's caption is a real unlock line at 0
      (verified live, see §4); delta chip only renders when `weekLessons > 0`; heat-strip renders
      honest 0-of-7 at zero.
- [x] **No `CountUp` on money** — none of the Learn metrics are money; `CountUp` is used only on
      course count / progress % / certificate count (non-money, per §7 of the amendment).
- [x] Getting-started strip, tabs, recommendations, quick-action logic: unchanged.

## 3 · WCAG AA checklist

- [x] Reuses the exact `VibrantMetricCard` + `.vh-hero` classes already AA-verified on Home Slice A
      (same accent CSS variables, same text-on-tint contrast ratios) — no new colors introduced.
- [x] Color never the only signal (icons + labels on every card); `HeatStrip`/`AnimatedRing` carry
      `aria-label`s (verified via accessibility tree — see §4); whole-card links keep focus rings.
- [x] Gold not used on this surface (no earn accent on Learn).

## 4 · Live-verified (dev server, `next-dev`, demo test user)

- Accessibility-tree read confirms: `vh-hero` header renders "Your learning, Ashish" + goal subline
  + streak/progress chips; key-metric region renders all 4 cards with honest-zero captions
  ("Enroll to begin your journey.", progress ring `aria-label="Overall progress 0%"`, "Finish a
  course to earn one.", `HeatStrip` `aria-label="Active 0 of the last 7 days"`, "Start today.");
  getting-started strip, tabs, recommendations (3 real catalog courses), quick actions all intact.
- **Zero console errors**, no hydration warnings.
- **375px viewport:** `scrollWidth <= clientWidth` (no horizontal overflow).
- Screenshot capture wedged in this environment (same intermittent pane issue noted on prior
  packets) — verified via full accessibility-tree read instead, which surfaces both structure and
  live ARIA values (a stronger check than a static image for the honesty/ARIA claims above).
- Real-progress-state rendering (bold focal delta chip, live Spark, populated heat-strip) was not
  re-verified live — no second seeded test account with lesson progress was available in this dev
  DB — but it is the identical `VibrantMetricCard`/`CountUp`/`AnimatedRing`/`HeatStrip` composition
  already live-verified with real data on Home Slice A; only the input data differs.

## 5 · Green checklist

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — 0 errors (4 pre-existing warnings, unrelated files)
- [x] `npx prettier --write` applied to both changed files
- [x] `next build` — compiles successfully (webpack + typecheck pass); production build then hits
      the known-by-design dev-provider guard on `/api/webhooks/razorpay` page-data collection
      (`PAYMENT_PROVIDER=mock` etc. locally) — unrelated to this change, same as every prior packet
      on this machine (see `windows-build-eperm-junctions` note)
- [x] `npm test` — **483/483 passed**

## 6 · Known limitations / follow-ups (not blockers)

1. Continue hero, Activity chart, course/recommendation cards, and quick actions stay on the
   dc-recipe — matches the spec's "composition, not new CSS" instruction for Slices B/C; a future
   pass could vibrant-ize these if the founder wants a fuller re-skin.
2. Real-progress-state (non-zero) rendering not independently screenshotted this session (see §4);
   low risk given identical, already-verified component reuse.
3. Slice C (Earn hub + wallet interiors) remains — money-adjacent, will need Tier-A review per
   Command Center Spec §4.2 / Slice 4.

## 7 · Self-assessment (5 lines)

This slice is pure composition: the Learn page swaps its header and stat row onto the same three
promoted components (`VibrantMetricCard`, `CountUp`/`AnimatedRing`, `HeatStrip`) Home already ships,
and the only `lib/` change is three additive fields read from data the loader already fetched — the
`git diff -- lib modules` check confirms no logic moved. The riskiest thing about a Learn re-skin
(accidentally touching the earn-visibility gate on "Refer a friend") is untouched by construction.
Live verification via the accessibility tree confirms honest-zero states render with real unlock
copy and no fabricated numbers; screenshot capture wedged (environmental, not code) but the ARIA
read is a stronger data source for the honesty claims than a static image would have been. Fully
reversible by dropping the branch.

**PARKED on `gps-rollout-learn` — awaiting steward Tier-B review + explicit merge authorization.**
