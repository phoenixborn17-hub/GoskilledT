# Review Packet — Vibrant Home desktop width fix (Tier B, PARKED)

**Branch:** `gps-home-width` (off `main@613e72d`) · **Date:** 2026-07-12 · **Status: PARKED — no merge**
**Change:** ONE class in `components/nav/app-shell.tsx` — the shell content container `max-w-5xl`
(1024px) → `max-w-6xl` (1152px) + explanatory comment. Display only.

**Why:** the live vibrant Home rendered in a 1024px column that read cramped/sparse on desktop with
a dead gutter, vs the founder-approved preview which ran 1152px. 1152px also sits inside the
Experience System §5 container spec (max 1200–1280px — the old 1024 cap was actually _below_ spec).
The fix is shell-level so every dashboard workspace gains the same balanced width (consistent
chrome; Slices B/C land on it).

**Live-verified (dev server):**

- Desktop 1536px: `main` = **1152px**, centered with **symmetric 156px/156px gutters** beyond the
  72px rail; metric grid `repeat(4, minmax(0,1fr))` (4-up as designed); rail→content gap = 32px
  padding (unchanged).
- Mobile 375px: full-width single column, metric grid `repeat(2, …)`, **no horizontal overflow**.
- No data/logic/nav change of any kind: one className. Honesty/perf locks untouched by construction.

**Green:** `tsc` clean · `eslint` clean · `next build` green.

**Note:** affects all `/dashboard/*` workspaces equally (Learn/Earn interiors get the same, slightly
wider container — consistent with the one-canvas rule, spec-conformant). If any interior form page
reads too wide after Slices B/C, cap that page locally rather than re-narrowing the shell.

**PARKED on `gps-home-width` — awaiting steward Tier-B review + merge authorization.**
