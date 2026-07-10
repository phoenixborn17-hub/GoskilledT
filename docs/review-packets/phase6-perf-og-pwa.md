# Review Packet — Phase 6 (perf · a11y · OG · PWA / U7) · infra slice

**Branch:** `gps-phase6-perf-og-pwa` (cut from `main @ 6be0a90`)
**Tier:** B (metadata/share-image infra + a static PWA config fix — no money, auth, schema, or webhook surface)
**Diff:** `phase6-perf-og-pwa.diff` (5 files, +400 / −37)

---

## What this is

Phase 6 was **mostly already folded** into earlier phases (fonts via `next/font`, default + certificate OG,
PWA manifest + security-first service worker + real icons, WCAG skip-link, reduced-motion + device-tier CSS
gates, server-side lazy analytics). This slice closes the genuine remaining gaps and records the perf/a11y
verification. It is **presentation/metadata only** — no product logic, no money path, no schema.

## Changes

1. **Course OG image** — `app/courses/[slug]/opengraph-image.tsx` (new). Dynamic WhatsApp/social share card
   for `/courses/<slug>`: title · category pill · **honest** facts (published → modules/lessons/duration;
   coming-soon → no fabricated stats, just "Learn in simple Hinglish") · gold accent bar (Golden Rule 14) ·
   GST/refund trust line. Unknown/system slug → neutral brand fallback (never renders fabricated data). D-29
   clean (describes the course, no income claim). Mirrors the certificate-OG pattern.
2. **Register "invite" OG image** — `app/register/opengraph-image.tsx` (new). Share card for the invite
   landing. **Compliance-safe by design:** carries NO referrer identity (no PII/attribution — that
   personalization is deferred to Phase 7 / DR-040) and NO income claim (D-29). Matches the page's own
   invite-only copy (DR-036).
3. **`lib/og/fonts.ts`** (new) — shared Sora font loader for `next/og` canvases; best-effort (null on any
   failure → sans-serif fallback, never breaks a build/request). The existing default `app/opengraph-image.tsx`
   is refactored to reuse it (−37 lines of duplication).
4. **`app/manifest.ts`** — bug fix: `start_url` `/dashboard` → `/dashboard/home` (the installed PWA now opens
   to the actual post-login landing, DR-039/DR-042).

## Deliberately NOT built (with rationale — challenge-with-logic)

- **Scroll-reveal** — *already implemented* in T5 via native scroll-driven CSS (`animation-timeline: view()`),
  slide-only (no opacity fade — a deliberate a11y choice so below-fold content is never `opacity:0` to AT / axe).
  A JS re-implementation would be redundant, reintroduce the exact a11y problem T5 avoided, and violate the
  "keep client JS minimal" rule. Verified live: homepage has 7 `.reveal` sections; capable browsers get the
  native reveal, others degrade to instant (fail-open). **Nothing to add.**
- **Money "updated X min ago"** — *correct-by-design, nothing to build.* The service worker (correctly,
  security-first) never caches money/authed pages, and money is always server-rendered fresh. A real staleness
  label would require a client-side money snapshot (localStorage/IndexedDB) = a reversal of the no-money-cache
  posture + money-on-device = Tier-A/security decision, not Tier-B polish. A label on an always-live value
  would also be misleading. Recommend keeping the current always-fresh posture.
- **Referrer-personalized OG / share-URL harmonization** — attribution surface = **Phase 7 (DR-040)**. The
  compliance-safe, non-personalized invite card (#2) is the Phase-6-appropriate slice.

## Tests / verification

- `npm run typecheck` — **clean**.
- `npx vitest run` — **money non-regression green** (earning-gate-webhook 5/5, quiz-cert-gate 6/6, commission,
  clawback). One full-run file failure was `money-flow.integration` failing its `beforeAll` under **shared
  live-DB contention** (parallel integration suites racing on the same Supabase) — **re-run in isolation:
  4/4 PASS**. Documented environmental flakiness, no code-path link to this diff.
- **Prod build clean** (`next build`, HOME/USERPROFILE redirect + `APP_ENV=staging`): all 4 OG routes +
  manifest compile; **shared First-Load JS 102 kB unchanged** (zero bloat); consumer routes 103–123 kB
  (within budget). `/register/opengraph-image` builds as a 205 B server route.
- **OG rendering verified** (dev): every OG route returns `200 image/png`; `og:image`/`twitter:image` auto-wire
  onto `/courses/[slug]` and `/register` page metadata. Cards rendered + visually reviewed (Sora display font,
  gold accent, honest facts).
- **a11y sweep** (public surfaces): single `<h1>` per page, no heading-level skips, no missing `alt`, no
  unlabeled inputs / unnamed buttons/links, `lang="en"`, skip-link is the first focusable element. (The
  transient multi-`<main>` count was a dev-streaming router-cache artifact — one `<main>` per route in prod.)

## 5-line self-assessment

1. **Correctness:** additive metadata/image routes + one static manifest string; every OG loader is
   fail-safe; no money/auth/schema/logic touched; money non-regression proven green.
2. **Honesty (D-29):** course OG shows only real facts (no fake stats on coming-soon); invite OG carries no
   income claim and no referrer PII; nothing fabricated.
3. **Scope discipline (DR-031):** two spec items resolved as already-done / correct-by-design instead of
   building redundant or misleading code; personalization correctly deferred to Phase 7.
4. **Perf/a11y:** prod build clean with unchanged shared-JS budget; public-surface a11y sweep clean; the
   `<2s` throttled budget-Android Lighthouse remains a staging + real-device step (Step 9 / founder-lane).
5. **Risk:** low — presentation-only, GATE-parked (no self-merge), reversible; no launch-config or provider
   dependency introduced.

## Remaining for Phase 6 (out of this slice)

- `<2s` throttled budget-Android Lighthouse recapture on **staging** (needs deployed prod build + real device) —
  Step 9 / founder-lane.
