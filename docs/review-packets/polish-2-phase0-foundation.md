# Review Packet — Polish Sprint 2 · Phase 0 (Design-System Foundation)

**Branch:** `gps-polish-2-foundation` (cut from up-to-date `main` @ `e66795d`)
**Tier:** B (UI primitives; no routes/data/money/schema touched → no Tier-A escalation)
**Diff:** [`polish-2-phase0-foundation.diff`](polish-2-phase0-foundation.diff) · 12 files, +571 / −92
**Source of truth:** `docs/DESIGN_DIRECTION.md` v1.0 · Genesis/04_GPS/DESIGN_IMPROVEMENT_PLAN_v1 (Phase 0)
**Status:** ⏸️ PARKED — awaiting Opus §19 review + explicit merge authorization (GATE). Not merged.

---

## What this is

The reuse primitives every later Polish phase compounds on. **Foundation only — no surface was
redesigned.** New primitives were adopted 1:1 on two representative surfaces (auth forms) as clean,
no-regression swaps; everything else is untouched and pixel-identical.

## Scope delivered (the six primitives + token wiring)

1. **Tokens → Tailwind** (`tailwind.config.ts`, `app/globals.css`)
   - Elevation ramp `shadow-gs` / `shadow-gs-lg` and radius ramp `rounded-gs*` wired to the existing
     `--gs-shadow-*` / `--gs-radius-*` CSS tokens — one source of truth for depth/rhythm.
   - Neutral ramp exposed as `n-050…n-900` (`bg-n-050`, `border-n-150`, `text-n-700`).
   - Semantic tokens `success` / `warning` / `warning-strong` / `danger` / `info`.
   - **Namespaced** (`shadow-gs*`, `rounded-gs*`, `n-*`) so Tailwind's built-in `shadow-sm` /
     `rounded-lg` / default `neutral` palette are untouched → zero regression on existing surfaces.
   - Added `--gs-warning-strong: #8a5a00` — required for WCAG AA of amber text on amber-tint
     surfaces (see verification). Not speculative: the Alert `warning` variant needs it.

2. **Card** — `flat | raised | interactive` elevation prop (`components/ui/card.tsx`).
   `raised` (default) reproduces the historical card **byte-for-byte** → existing cards unchanged.
   `interactive` adds the reduced-motion-gated `.lift` hover + focus-within border tint.

3. **Button** — `size` (`sm | md | lg`, `md` = historical default) + real `loading` state
   (spinner, `aria-busy`, auto-disable → prevents double-submit) + disabled polish + Level-1 `.press`
   moved to the base so **all** variants get the press micro-interaction (`components/ui/button.tsx`).

4. **FormField** — Label + control + inline error + hint + success tick wrapper, with correct
   `htmlFor` / `aria-describedby` / `aria-invalid` wiring; accepts a custom control via `children`
   (e.g. `OtpInput`). No internal vertical-spacing utility → an idle field renders identically to the
   hand-written markup it replaces (`components/ui/form-field.tsx`).

5. **State primitives** (`components/ui/`)
   - **EmptyState** — illustration glyph + one warm Hinglish line + one CTA + `.enter` motion.
   - **ErrorState** — calm, plain-language, retry affordance; mirrors the branded route error
     boundary. No red walls.
   - **LoadingState** — fixed-height skeleton template (heading + lines) → CLS 0.
   - **SuccessState** — check pop-in (reduced-motion-gated) + optional earned confetti.

6. **Alert** — `info | success | warning | error`, soft tint + accessible text + lucide icon;
   assertive `role="alert"` for warning/error, polite `role="status"` for info/success
   (`components/ui/alert.tsx`).

## Representative adoption (clean 1:1 swaps — the only surfaces touched)

- `app/login/login-form.tsx`, `app/register/register-form.tsx` → fields to `FormField`, form-level
  errors to `Alert variant="error"`, submit buttons to `Button loading={busy}`.
- Idle-state geometry verified **pixel-identical** (below). The error presentation is the intended
  standardization (calm iconed Alert replacing ad-hoc `text-red-600`), per the sprint brief.

## Explicitly NOT done (scope discipline)

No surface redesign · no new pages/features/business-logic/schema · no copy-slot (LC) changes ·
no speculative components (no Dropdown/Tabs/Tooltip/etc.) · the ~40 remaining `text-red-600` sites
and other forms were left for natural adoption in Phases 1–5 (this sprint ships the primitives, not
a repo-wide sweep).

---

## Verification

**Gates (all green):**
- `npm run typecheck` — clean.
- `npx vitest run` — **37 files / 280 tests passed** (money/webhook/cert suites unaffected).
- `npm run lint` — 0 errors (4 pre-existing warnings in `guru-panel` / qa scripts, none mine).
- `npx prettier --check` on all 12 changed files — clean. (`public/sw.js` + `offline.html` show
  format warnings but are **unchanged vs main** — pre-existing; formatted only on the `gps-ci`
  branch, out of scope here.)

**Live verification** (dev server, `preview_inspect`/`eval` computed values — see note on screenshots):

| Check | Result |
|---|---|
| New token utilities resolve | `bg-n-500`→`#6e766e`, `border-n-150`→`#e2e6e2`, `shadow-gs`→`rgba(42,48,42,.08) 0 2px 8px`, `rounded-gs`→12px, `shadow-gs-lg`→`…0 8px 28px`, `text-danger`→`#c0392b`, `text-warning`→`#b87a00` ✓ |
| Card default = zero regression | radius 16px · `shadow-sm` (`rgba(0,0,0,.05) 0 1px 2px`) · border `charcoal/10` · p-6 · white — identical to pre-refactor ✓ |
| Card `interactive` lift | `.lift` present, reduced-motion-gated transition `transform, box-shadow, …` ✓ |
| FormField swap pixel-identical | label→input gap **6px** (no double-gap) · input 44px / radius 12px / border `charcoal/15` · submit 44px full-width — matches hand-written markup ✓ |
| Alert WCAG AA (text / icon on own tint) | info **5.43** · success **7.26** · warning **5.93** (was 3.61 — fixed via `warning-strong`) · error **5.44** — all ≥4.5:1 text, ≥3:1 icon ✓ |
| Alert roles | info/success `status` · warning/error `alert` ✓ |
| FormField a11y | error → `role="alert"` + `aria-invalid` + `aria-describedby` wired ✓ |
| State primitives roles | EmptyState CTA · ErrorState heading+retry · LoadingState `aria-busy`/`status` · SuccessState `status` ✓ |
| CLS | **0** (buffered layout-shift, 360px) ✓ |
| Mobile-first 360px | no horizontal overflow (login + primitives) · touch target 44px ✓ |
| Motion | all effects reduced-motion-gated by construction (`.lift`/`.press`/`.enter` under `prefers-reduced-motion: no-preference`; `motion-safe:` for spinner/pulse/pop) ✓ |

**Screenshots:** the `preview_screenshot` tool timed out repeatedly in this environment on **every**
page (including the untouched home page) — Next dev keeps an open HMR socket, so the tool's
network-idle wait never resolves. Visual properties were instead verified with `preview_inspect` /
`preview_eval` computed-value reads (exact px/hex/contrast), which the tooling guidance recommends
over screenshots for precisely this. Reported faithfully rather than fabricated.

---

## Self-assessment (5 lines)

1. **Correctness** — Primitives compile clean, 280 tests unaffected; adoption limited to 2 auth forms
   with geometry proven identical. One real AA defect (warning amber 3.61:1) was caught in live
   verification and fixed with a dedicated `warning-strong` token.
2. **Scope** — Foundation only. Zero surface redesign, zero new scope; namespaced tokens guarantee
   existing surfaces are byte-identical. Remaining swaps deferred to Phases 1–5.
3. **Design Direction v1.0** — §15 states, §10 Level-1 motion (mandatory press/hover/loading now on
   all buttons), §9 one-ramp tokens, gold-contrast rule (warning = amber, never gold), 320px-first,
   CLS 0 — all satisfied.
4. **Risk** — Low. Additive tokens + opt-in variants; the only behavioral change to existing buttons
   is a reduced-motion-gated press-scale (Level-1, mandated). `tailwind.config.ts` changes need a dev
   restart to regenerate (documented; irrelevant to production build).
5. **Consistency Test** — Alert/FormField/Card now give one canonical look for errors, fields, and
   elevation across the product; nothing here could pass as a different project's component.

## §19 gaps / follow-ups for reviewer note

- **PRODUCT_DEBT (not this sprint):** ~40 `text-red-600` sites + remaining forms across admin /
  affiliate / checkout / dashboard should adopt `Alert` / `FormField` during their Phase-1–5 passes.
- SuccessState confetti reuses the existing `Confetti` primitive; no new motion budget consumed.
