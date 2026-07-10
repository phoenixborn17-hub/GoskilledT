# Review Packet — Phase 3: Learn Workspace (Redesign U4)

- **Branch:** `gps-learn` (off `main` @ `df1243d`) · **Commit:** `e1e8be1`.
- **Tier:** B (re-skin; no money/PII/architecture change). **GATE: PARKED — not merged. `main` untouched.**
- **Read:** Dashboard_Redesign_v3.0 §3 · IA v2.0 §5.2 · Frozen_Spec_Amendments · Experience System · DecisionCard system (+ Pass 2).

Phase 3 re-skins the Learn workspace onto the locked Decision Card system + Home-hub patterns — **re-skin in place**: no route or business-logic change, money math untouched, and the **signed-URL / leak-tested playback logic is NOT touched** (the player enhancements are client-only UX).

## What was built

**Cleanup — one home.** `app/dashboard/page.tsx` (the old composite hub) now `redirect('/dashboard/home')`. Verified live.

**Learn dashboard** (`/dashboard/learn` + `lib/learn/dashboard.ts` composite over existing accessors — `getEnrolledCourses`/`getGamification`/certificate count/`getNextWebinar`/catalog; no new logic):

- **Continue-Learning hero** (Decision Card) with a rules-based AI line ("You're X% through — N lessons to your certificate").
- **≤4 stat cards** — Courses · Overall progress % · Certificates · Streak (fail-safe via `safeCount`).
- **Overview / Activity tabs** — Activity renders a lazy inline-SVG area chart of the last-14-days completions; **honest empty** when there's no activity yet (D-29), never a fabricated line.
- **Recommendations** (real non-owned catalog courses) · **Quick Actions** (≤4) · **Guru in-context chips** (deep-link to the real in-lesson Guru with a ready doubt).
- **Zero-data → 3-step getting-started** (never empty widgets).

**My Courses** (`/dashboard/courses`) — owned `CourseCard`s + **Buy CTA on non-owned catalog** ("Discover more" → `/courses/[slug]`) + the honest "as released" Career Booster roadmap.

**Progress** (`/dashboard/progress`) — per-course **SemicircleGauge** + kept Milestones + **certificate with WhatsApp share** (existing leak-tested `CertificateCard`) + Guru "explain-my-gap" chip.

**Course Player** (`components/dashboard/lesson-player.tsx`, client-only):

- **Data-saver toggle** — defers download now (`preload="none"`) + stamps `data-quality="480p"` as the seam the real 480p cap wires to when Cloudflare Stream HLS quality levels land (DR-022). Defaults ON for Save-Data / low device-tier; persisted; honestly labelled (doesn't claim a cap it can't yet apply to a single-URL mock).
- **Visible resume-position** — throttled `currentTime` → `localStorage`, offering a **"Resume from mm:ss"** seek chip on return; clears near the end.
- `completeLessonAction` / certificate / confetti / first-win logic preserved **verbatim**. `src`/`resolvePlayback` untouched.

**Tokens** — `globals.css` now sets a workspace-themed default `--card-accent` so Decision-Card viz (the Progress gauge) render correctly **outside** a Decision Card.

## Verification

```
tsc --noEmit → 0 · prettier → clean · eslint (changed) → 0/0
vitest --exclude integration                → 373 passed
LMS + money non-regression                  → 34 passed
  (lms-flow · lms-progress · certificate · quiz-cert-gate · money-flow)
```

**Browser (next-dev, authenticated):**

- `/dashboard` → **redirects to `/dashboard/home`** (confirmed).
- `/dashboard/learn` → `data-theme="learn"` (green); **server HTML + live DOM contain "Your learning" + the zero-data getting-started** (the fresh test account has no progress, so the honest zero-data path shows — correct).
- `/dashboard/courses` → "My courses" + empty/discover; `/dashboard/progress` → "Progress" + honest empty — both render (authoritative server fetch).
- **No hydration / console / server errors.**

> **Screenshots note (honest):** the preview renderer got stuck after repeated HMR reloads (prettier rewriting watched files + a server restart), so I could not capture image screenshots this session. I verified rendering the reliable way instead — server-render fetches + live-DOM `outerHTML` inspection (content present) + zero hydration errors. The **rich** Learn paths (Continue hero, stat cards, Activity chart, gauges) are implemented + typechecked but not shown by the fresh test account (no enrollment/progress); they render for a user with learning data. Worth an eyeball on a seeded account at review.

## Locks held

Re-skin in place (no route/logic edits; player URL logic untouched) · money math untouched · D-29 honest states (zero-data getting-started, honest empty charts, no fabricated data) · device-tiered (Decision Cards + data-saver default) · WCAG (labels, focus rings, ≥44px) · zero money/LMS non-regression.

## Notes / follow-ups (not blockers)

- **Data-saver 480p** genuinely defers data now (preload) + is the honest seam for a real 480p cap once adaptive HLS (Cloudflare Stream) lands — labelled truthfully, not a fake control.
- **Perf** — Learn first-viewport is server-rendered; the Activity chart is inline SVG (no chart lib). Formal <2s throttled budget-Android recapture stays Phase-6 prod-build work.
- Certificates/Webinars remain their existing surfaces (verify page / `/webinar`) surfaced via Learn (share-cert + webinar widget/chips); no new routes (re-skin-in-place).

## Self-assessment

1. All Learn surfaces re-skinned onto the Decision Card system + Home-hub patterns; the old hub is retired to one home.
2. Player enhancements (data-saver + resume-position) are client-only and honest; signed-URL/leak-tested + completion/cert logic untouched.
3. Locks held; green suite (373 + 34, incl. LMS/money non-regression); server-render verified for every surface.
4. Honest about the screenshot gap (stuck renderer) — verified via server-render + live-DOM instead; flagged the rich-path eyeball for a seeded account.
5. Parked for review — no merge sought; next = Phase 4 (Earn workspace, money/PII → Fable Tier-A) after review + authorization.
