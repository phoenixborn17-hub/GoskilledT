# Review Packet — Slice 5 · Journey-Break Fix (in-app browse) (Tier B, PARKED)

**Branch:** `gps-cc-browse` (off `main@d7b22c7`) · **Date:** 2026-07-12 · **Status: PARKED — no merge**
**Spec:** `docs/specs/Command_Center_Dashboard_Spec.md` §4.3 (Anchor C) + §6 Slice-5.
**Tier:** B — display + routing only. **Steward review requested**; merge only on explicit authorization (GATE).

---

## 1 · What changed (by commit)

| Commit    | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `efb5e22` | **Guards + tests** — `lib/nav/focus-mode.ts` (pure, unit-tested player-route detection; `browse`/`webinars` excluded — the Slice-3 hand-off) wired into the shell; `lib/catalog/reserved-slugs.ts` + publish-boundary guard in `lib/admin/catalog.ts` (`publishCourse` refuses a course slugged `browse`/`webinars` with an actionable error); `tests/browse-routes.test.ts` (9 tests).                                                                                                                                                                                                                                                                                  |
| `6f36f08` | **The in-app routes** — `/dashboard/learn/browse` (courses grid: owned = badge+progress+Resume · unowned = stats+View course · coming-soon = honest "as released, no dates promised" · `#packages` section: DR-021 package cards + comparison table + checkout links); `/dashboard/learn/browse/[slug]` (read-only curriculum w/ free-preview/lock markers, packages-including-it context, watch-free-preview + See-packages CTAs, **owned viewer → redirect to the player**, DRAFT → 404); `/dashboard/learn/webinars` (thin wrapper over the SAME `getNextWebinar` + `registerWebinar` the public page uses — real session, countdown, gcal, honest no-session state). |
| `5342875` | **Re-point all 8 crossings** (table below) — routing only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `45f37e6` | guru-panel Unlock `<a>` → `next/link` (build lint).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## 2 · Re-pointed crossings (the spec's verified table — all closed)

| #   | Surface                                                                                  | Was (marketing)            | Now (in-app)                |
| --- | ---------------------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| 1   | Learn sidebar "Browse" (`lib/nav/workspaces.ts`)                                         | `/courses`                 | `/dashboard/learn/browse`   |
| 2   | Learn sidebar "Webinars" (`lib/nav/workspaces.ts`)                                       | `/webinar`                 | `/dashboard/learn/webinars` |
| 3   | Learn dashboard (3 CTAs) + webinar card (`learn/page.tsx`)                               | `/courses` ×3 · `/webinar` | browse ×3 · webinars        |
| 4   | Home: Store strip · webinar metric · webinar hero card · webinar nudge (`home/page.tsx`) | `/courses` · `/webinar` ×3 | browse · webinars ×3        |
| 5   | My Courses "discover more" (`courses/page.tsx`)                                          | `/packages`                | `browse#packages`           |
| 6   | Progress upsell (`progress/page.tsx`)                                                    | `/packages`                | `browse#packages`           |
| 7   | Earn get-your-package (`earn/page.tsx`)                                                  | `/packages`                | `browse#packages`           |
| 8   | Player locked-lesson CTA (Slice-3 hand-off) + guru-panel Unlock (dormant)                | `/packages`                | `browse#packages`           |

Account "Support" → `/contact` remains the ONE accepted public seam (spec §4.3 / founder open-item #2, low-frequency + exit-tolerant). Public `/courses`, `/packages`, `/webinar` untouched for logged-out acquisition. **Live-verified:** rendered Home + Learn dashboards contain ZERO `href="/courses"` / `href="/webinar"` / `href="/packages"`; Learn shows 10 in-app browse links + the webinars link.

## 3 · HARD-LOCK confirmation — purchase / entitlement / checkout logic untouched

- `git diff main...HEAD -- app/checkout lib/payments lib/lms lib/wallet lib/affiliate modules` → **EMPTY.** Buying still flows through the real, unchanged checkout (`/checkout?package=…` entered from in-app); enrollment, playback gating, money paths: same bytes as main.
- The whole `lib/` diff is 4 files: the two new pure guard modules, the 10-line publish-boundary guard (an added _refusal_, no write-path change), and the two re-pointed hrefs in `workspaces.ts` (Nav v1.1 structure — items/order/icons/workspaces — identical).
- The new pages are read-only compositions of existing queries (`listCatalogCourses`, `getCourseDetail`, `listPackages`, `getEnrolledCourses`, `isEnrolled`, `getNextWebinar`) + the existing `registerWebinar` action. **Live-verified:** the browse detail response contains no `<video>`/playback URL — discovery never leaks playback.

## 4 · Green checklist

- `tsc` clean · `eslint` clean · `prettier` applied · **`npm test` 483/483** (474 prior + 9 new: focus-route matrix incl. `browse/`, `webinars`, `browser-basics` edge cases; reserved-slug case-insensitivity + error copy).
- `next build` green — the three new routes register (`/dashboard/learn/browse` · `browse/[slug]` · `webinars`, each ≤3.4 kB page JS).
- **Live-verified on the dev server (logged-in test user):** browse index renders courses + `#packages` + comparison table + checkout links **with the FULL sidebar (no slim rail — focus-mode exclusion working)**; detail renders curriculum/locks/FREE/preview-CTA; webinars renders session + registration; owned→player redirect path type-checked (test user owns nothing, so unowned branches were the ones exercised live).

## 5 · Perf + a11y note

- **Perf:** no new client libraries; the only client component reused is the existing `WebinarCountdown` + `LeadCaptureForm`; browse/detail are pure server renders over one query round each. _Local-only observation:_ the shared test DB carries hundreds of leftover integration-test courses, so the local browse payload is huge — production catalog is DR-011-capped at 7 courses; not a code path issue.
- **A11y:** comparison table = real `<table>` with `caption` + `scope`d headers; owned state = Badge + progress (never color-only); all CTAs are focus-ring links/buttons ≥44px; `#packages` target has `scroll-mt` so the anchor lands un-clipped; honest empty/coming-soon states carry next steps (never a dead end — design law §1.3).

## 6 · Known limitations / follow-ups (not blockers)

1. `LeadCaptureForm` (reused on the in-app webinars page) still speaks the marketing vocabulary — one of the remaining Slice-2 sweep files; functional + consistent enough to ship, logged for the sweep.
2. Browse has no category filter/search — production catalog is 7 courses (DR-011); add only if the catalog grows (would be new scope otherwise).
3. The registration form asks the logged-in user's name/phone rather than prefilling — prefill would touch the lead-capture contract (CRM logic), out of Slice-5's display-only scope; noted as a nice-to-have.
4. Reserved-slug guard sits at the publish boundary (the only admin path that makes a course public — admin cannot create courses or edit slugs per DR-011/slug-immutability); seeds/migrations must respect `RESERVED_COURSE_SLUGS`, now documented in the module.

## 7 · Self-assessment (5 lines)

The journey break is closed by addition + re-pointing, not by touching anything that moves money or grants access: the whole lib diff is two pure guard modules, a publish refusal, and two hrefs, and the checkout/entitlement diff is empty by construction. Both Slice-3 hand-offs landed with tests (focus-mode exclusion has an edge-case matrix; the reserved-slug guard fails loud with an actionable message). The new surfaces reuse existing queries and the DecisionCard system, so they inherit tokens, depth, honest states, and device tiering rather than re-implementing them. Residual risk is again visual-only (pane can't screenshot — same environmental issue, staging pass recommended) plus the marketing-styled lead form inside the webinars page, which is cosmetic and queued for the sweep. Fully reversible by dropping the branch.

**PARKED on `gps-cc-browse` — awaiting steward Tier-B review + explicit merge authorization.**
