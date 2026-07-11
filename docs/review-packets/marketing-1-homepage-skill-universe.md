# Review Packet — Marketing Slice 1: Homepage + Living Skill Universe hero

**Branch:** `gps-marketing` (cut from up-to-date `main`) · **Status:** PARKED — not merged · **Tier: B**
(marketing/UI, presentation-only; no money/auth/schema/webhook/route/data changes → not Tier-A).
**Commit:** `1a593d5` · **Diff:** `marketing-1-homepage-skill-universe.diff` (1104 lines) / `.stat`.

## What changed
The homepage front door, rebuilt to the Public Experience charter — from a tidy card-stack brochure
into a cinematic, honest journey with one memorable signature moment.

1. **⭐ Living Skill Universe hero** (`components/marketing/skill-universe.tsx` + `lib/marketing/skill-universe.ts`).
   Centre = You; skill nodes orbit with animated connectors. Nodes are **derived from REAL catalog
   categories** — a node is "Live now" only if a PUBLISHED course exists in that category, else
   "Coming soon". Today that renders **AI + Marketing = Live**, **Finance / Tech / Skills = Soon**,
   straight from the DB. Hover / tap / keyboard-focus a node → an honest reveal (what you'll *learn*
   + real status + a real link). The universe **grows automatically** as new course categories ship.
2. **Two-column hero** — headline + primary CTA render first (LCP + thumb-reach on mobile); the
   interactive universe sits beside on desktop, below on mobile.
3. **Learn → Grow journey** scroll-story (5 steps: Learn → Build a skill → Gain confidence → Open
   opportunities → Keep growing). Replaced the old "How it works" (which mentioned affiliate/referral
   mechanics) — the public site is now **learning-first** with no earn mechanics (charter honesty lock).
4. **Sticky mobile CTA bar** (`components/marketing/mobile-cta-bar.tsx`) — thumb-first, safe-area aware.
5. **Device-tier provider** mounted at the app root (`app/layout.tsx`) so device-tiering engages
   site-wide (was only reduced-motion before).

## Key files
- `lib/marketing/skill-universe.ts` — pure, tested node builder (honesty logic).
- `components/marketing/skill-universe.tsx` — client island (the only new client JS).
- `components/marketing/mobile-cta-bar.tsx` — server component, zero JS.
- `app/page.tsx` — hero + journey recomposition (still server-rendered, real catalog data).
- `app/globals.css` — `.su-*` styles (device-tiered, reduced-motion-gated, transform/opacity only).
- `app/layout.tsx` — `<DeviceTierProvider />` (null UI).
- `tests/skill-universe.test.ts` — 5 tests.

## Tech choice (per charter "right tool, not Three.js by default" + §H "no launch R3F")
**SVG connectors + CSS-positioned accessible DOM nodes — no WebGL.** Crisp at any DPI, ~zero weight,
each node a real focusable `<button>`, motion is CSS transform/opacity (60fps, CLS 0). No new deps.

## Checks (green before packet)
- `tsc --noEmit`: **clean.**
- `eslint` (changed files): **clean.**
- `prettier --write`: applied, stable.
- Unit tests: **387/387 green** (incl. 5 new honesty-guard tests; live-DB integration excluded per the
  shared-Supabase policy).
- `next build`: **compiles + passes full type-check + lint.** It then stops at the pre-existing
  production provider-guard (`lib/config/providers.ts`) because local `.env` uses mock providers —
  expected, unrelated to this change (prod secrets live in Vercel).

## Render / behaviour verification (via the running preview; screenshotter timed out in this env, so
verified with the accessibility snapshot + computed-style inspection + interaction, which the tooling
guidance prefers for correctness):
- Hero renders: eyebrow, "Seekho. Badho. Kamao.", subline, Register-free + Free-webinar CTAs, trust chips.
- Universe: 5 nodes with correct **Live/Soon** labels; centre ring = green gradient + gold accent ring
  (brand-correct); 5 connectors + 5 pulses present; nodes 52px (touch target ≥44 ✓); tier stamped.
- Interaction: clicking **Finance** reveals "Coming soon" + honest subject blurb + "See the roadmap".
  (Fixed a click/hover toggle-cancel bug found during testing — click now always *selects*.)
- Mobile (375px): hero stacks, canvas fits, **zero horizontal overflow**, sticky bar visible.

## Honesty-lock checklist (D-29 + charter)
- [x] No fabricated counts / testimonials / outcomes / earnings anywhere.
- [x] Skill nodes = real catalog only; "[PLACEHOLDER]" seed titles never surfaced (clean category labels).
- [x] Node reveals describe **what you learn**, never an outcome or income (charter overrode its own
      "career outcomes" wording here — we have no such data and D-29 forbids it).
- [x] No earning mechanics advertised on the public site (removed the old affiliate "Share it" step).
- [x] Trust marks true only: "Registered LLP", "GST-inclusive pricing", "48-hour refund". No
      Government-approved / GST-registered / Startup-India claims.
- [x] Existing honest sections (Founding Batch, "we sell skills not dreams", no-guarantees) kept.

## Perf notes (Tier-2/3 budget Android)
- Hero text + primary CTA are server-rendered and first in the DOM → LCP-safe. One small client island.
- All motion transform/opacity, gated on `prefers-reduced-motion` AND `data-device-tier="low"`
  (reduced-motion / save-data / deviceMemory≤3 / no-backdrop-filter) → static legible network on low end.
- No new dependencies; no images/video added to the hero.

## Decisions worth a nod / open questions for the steward
1. **Primary CTA = "Register free"** (charter's stated conversion goal), secondary = "Join a free
   webinar". This shifts the hero primary from the older GPS-M1 §2.1 "cold-traffic → webinar" default.
   The webinar remains a prominent secondary + the sticky bar. Confirm this is the intended priority.
2. `.claude/launch.json` gained `"autoPort": true` so a second session can run its own dev server
   without fighting port 3000. Harmless dev-tooling; flag if you'd rather keep it pinned.
3. Featured-courses on staging show a "Certificate Test Course" (QA row in the shared Supabase) — data
   artifact of the live DB, not this change; real catalog data will display in prod.

## Not in this slice (next up)
Courses · Course Detail · Packages · Webinar · About · Contact · FAQ · Blog · Videos · Auth
(login/register/OTP/forgot) · success/404/empty/loading. Homepage was built first per the charter.

## Self-assessment (5 lines)
- Delivers the charter's first-and-most-important surface with a genuine, reusable signature moment.
- Honesty is structural, not cosmetic: the "live vs soon" truth is computed from the DB and unit-tested.
- Performance and accessibility held: no WebGL, CSS-only motion, real buttons, device-tiered fallback.
- Presentation-only — money/auth/routes/data untouched; 387/387 green confirms no regression.
- Needs a steward decision on the primary-CTA priority (item 1) before this becomes the site pattern.
