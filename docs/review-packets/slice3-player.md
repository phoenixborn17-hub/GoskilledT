# Review Packet — Slice 3 · Course Player (Tier B, PARKED)

**Branch:** `gps-cc-player` (off `main@c2f7ddc`) · **Date:** 2026-07-12 · **Status: PARKED — no merge**
**Spec:** `docs/specs/Command_Center_Dashboard_Spec.md` §4.1 (Anchor A) + §6 Slice-3 scope.
**Tier:** B — display + chrome layer ONLY. **Steward review requested**; merge only on explicit authorization (GATE).

---

## 1 · What changed (by commit)

| Commit    | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `8e64a72` | **Shell focus mode** — on `/dashboard/learn/<courseSlug>` the contextual sidebar collapses to a slim icon rail (w-14, same destinations, `aria-label`+`title` per icon) and the topbar drops the workspace label (the page owns its header); main column padding 304→128px. Nav v1.1 structure intact: switcher untouched (1-tap escape), mobile bottom bar + drawer unchanged, all routes/items identical.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `d6e752c` | **Player surface re-skin** — page header = Back · course title (Sora H2) · **the ring that fills** (`ProgressRing` + Spark endpoint, bound to real course completion; the count lives on as the ring's accessible name + a tabular caption). Lesson list gets module hierarchy (Sora module headers + real per-module `n/m`), dc-accent active row (bar + tint), success-green completed checks. Locked state → `DecisionCard` + **honest "See packages" CTA** (was hardcoded `?package=career-booster` — a locked course may come via Skill Builder OR Career Booster; `/packages` is the truthful chooser). **Completion momentum:** after marking complete, "Next: {up-next title}" becomes the promoted PRIMARY button and receives keyboard focus (`requestAnimationFrame` handoff) — a lesson never ends on a dead stop; pre-completion weighting (Mark-complete primary / Next outline) unchanged. New display-only prop `nextLessonTitle`. |
| `7c536c8` | **Quiz + certificate cluster token migration** — `quiz-checkpoint` · `certificate-moment` · `certificate-card` · `share-cert-button` onto canonical tokens (`ink`/`ink-muted`/`theme`/`theme-strong`/`danger`/`success`/type scale/`rounded-gs-lg`). Pure class swaps; every handler, action call, and state machine line untouched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Diffstat vs main:** 7 files, +295 / −166. Exactly the spec's Wave-V1 player cluster + the shell focus hook — no other surface touched (Home, wallet, vocab sweep of other files, journey-break routes: all untouched).

## 2 · HARD-LOCK confirmation — playback / signed-URL / progress / completion logic BYTE-IDENTICAL

Verified mechanically, not by eyeball:

- `git diff main...HEAD -- lib modules app/dashboard/actions.ts app/dashboard/quiz-actions.ts` → **EMPTY.** `resolvePlayback`, `getCoursePlayerView`, `canAccessLesson`, `completeLessonAction`, quiz grading, the video provider, and every server gate are the same bytes as main.
- The `lesson-player.tsx` diff contains **zero lines** touching `src` / `preload` / `data-quality` / `onError` / `onTimeUpdate` / `videoRef` / `localStorage` resume-position / `completeLessonAction` (grep over the diff: no matches). The `<video>` element and its attributes are character-identical; data-saver and resume-from-mm:ss behave exactly as before.
- The page still resolves playback ONLY for accessible lessons (server-side), and the quiz only when playback exists — same expressions, same order.
- **Live-verified on the dev server:** a locked lesson's response contains the locked DecisionCard + "See packages" and **no `<video>` element / no playback URL**; the free-preview lesson streams with controls + data-saver + Mark-as-complete as before.

The only behavioral additions are presentation-side: button weighting/labels after completion, a focus() call, and chrome (rail/topbar) recomposition.

## 3 · Green checklist

- `tsc --noEmit` clean · `eslint` clean on all touched paths (2 pre-existing warnings in the dormant `guru-panel.tsx`, untouched by this slice) · `prettier` applied.
- `npm test` — **474/474 passed** (full suite, including money + LMS integration).
- `next build` — green (compiled + types; run under the sanctioned staging escape for local mock providers, as on previous slices).

## 4 · Before / after

|               | Before                                                        | After                                                                                                                                       |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome        | full 72px switcher + 232px sidebar + topbar repeating "Learn" | switcher + slim icon rail (56px) + topbar without label — canvas gets ~180px back; 1-tap escape intact                                      |
| Progress      | plain text "3 / 12 lessons complete"                          | header ring w/ Spark live-edge (fills via the existing 300ms dashoffset transition on `router.refresh`); count kept as aria-label + caption |
| Modules       | `text-xs uppercase muted` labels                              | Sora headers + real per-module `n/m`, carded groups                                                                                         |
| Active lesson | `bg-brand/10 text-brand` flat row                             | dc-accent bar + tint, focus ring, success-green completed ticks                                                                             |
| Lesson end    | two equal-weight buttons — dead stop                          | promoted primary "Next: {title}" + keyboard focus handoff                                                                                   |
| Locked lesson | flat Card, hardcoded career-booster checkout                  | DecisionCard + honest "See packages"                                                                                                        |
| Vocabulary    | `charcoal/muted/brand/red-*/rounded-2xl` across 6 files       | canonical `ink/theme/danger/success` + type scale + `rounded-gs`                                                                            |

**Live server-render checks (dev server, test user):** slim rail present · no topbar "Learn" h1 · `md:pl-[128px]` · ring `role="progressbar"` + "Course progress: 0 of N lessons complete" · per-module counts + lock icons render · active-row accent classes present. Spark on the ring is honestly ABSENT at 0% (no live edge until progress exists — by design). Screenshot caveat from Slice 1 still applies to this embedded pane (cannot screenshot any page; stalls streamed DOM on unmodified main too) — staging visual pass recommended after merge.

## 5 · Perf + a11y note

- **Perf:** zero new client JS beyond a ref + one `requestAnimationFrame`; no new libraries, fonts, or animations — the ring reuses the existing CSS transition; focus-mode is pure class recomposition in the already-client shell. Fewer DOM nodes in chrome on player routes (icon rail vs full sidebar). Budget-Android path unchanged (video preload/data-saver logic identical).
- **A11y (AA):** slim-rail items keep full names via `aria-label` + `title`; keyboard/caption controls of the native `<video controls>` untouched and reachable; ring has `role="progressbar"` + value attrs + a descriptive label carrying the lesson count; per-module counts have `aria-label`s; active lesson keeps `aria-current`; focus handoff to Next is a visible-focus-ring button (no focus trap); completed chip uses icon+label, never color alone; all motion remains `motion-safe`/device-tiered (no new animation added).

## 6 · Known limitations / follow-ups (not blockers)

1. **Within-lesson watch arc** (spec's optional capable-tier micro: a faint secondary arc from `video.currentTime`) deferred — the ring binds to course completion; the optional live arc can ride with a later polish pass.
2. The focus-mode route test is `/^\/dashboard\/learn\/[^/]+$/` — when Slice 5 adds `/dashboard/learn/browse`, that route must be excluded (one-line change, noted for the Slice-5 builder).
3. Locked-lesson CTA now goes to public `/packages` — the journey-break for this CTA is Slice 5's re-point (in-app packages section); this slice only fixed the wrong-package honesty defect.
4. `border-charcoal/15`-style neutral alpha borders remain in the quiz options (consistent with canonical surfaces that use `hover:bg-charcoal/5`); flagged for the Slice-2 vocabulary judgment call rather than silently rewritten here.

## 7 · Self-assessment (5 lines)

The slice moves only pixels and chrome: the mechanical proof (empty diff on lib/modules/actions; zero playback/progress lines in the player diff) is stronger evidence than any review read-through, and the live locked-lesson fetch confirms the server gate still withholds playback URLs. The focus mode is deliberately conservative — recomposition of existing chrome rather than new chrome — so Nav v1.1 stays structurally byte-identical and the mobile experience is unchanged. The momentum change re-weights existing actions instead of adding flow logic, so completion behavior can't regress. Biggest residual risk remains visual: pixels verified by server-render assertions, not screenshots (environmental pane issue, reproduced on unmodified main); staging is the right visual gate. Fully reversible by dropping the branch.

**PARKED on `gps-cc-player` — awaiting steward Tier-B review + explicit merge authorization.**
