# Morning Packet — Public Experience (overnight autonomous run)

**Branch:** `gps-marketing` (off `main` @ b73402c) · **Status:** ALL PARKED — nothing merged, nothing
deployed, no seed run. · **Tier: B** throughout (marketing/UI; no money/auth-server/schema/env change).
**Reviewer:** steward (Opus) reviews the whole batch; the auth slice touches an auth *surface* (UI only)
so a Fable glance is prudent there.

## TL;DR
The entire public website was rebuilt to the Public Experience charter in one continuous run — a shared
premium component system, then every surface re-skinned on top of it. Real catalog data throughout, D-29
honesty locks held, each page device-tiered and green. 9 commits, 36 files, **387/387 unit tests green**,
tsc + lint + prettier + build-compile all clean.

## Green status
- `npx tsc --noEmit` — **clean.**
- `eslint` (all marketing + changed app) — **clean.**
- `prettier --check` — **clean.**
- Unit tests — **387/387 green** (5 new honesty-guard tests for the Skill Universe; live-DB integration
  excluded per the shared-Supabase policy).
- `next build` — **compiles + passes full type-check + lint**; stops only at the pre-existing
  production mock-provider guard (`lib/config/providers.ts`) — environment-only, unrelated to this work.

## What got built (per surface)

### 1. Foundation — shared marketing system  ·  `59d5e84`
- **Signature:** consistency-by-construction. Key files: `components/marketing/kit.tsx`
  (Container/Section/Eyebrow/SectionHeading/BentoCard/TrustChips/PageHero/CtaBand),
  `scroll-progress.tsx`, `stat-counter.tsx` (real-data-only count-up), `marketing-shell.tsx`,
  premium `site-footer.tsx`.
- **Honest data:** footer now carries the confirmed company identity — *EDZERA INSPIRING EXCELLENCE
  LLP · Registered LLP · MSME Registered*. No GST / Startup-India / Govt claims.
- **Perf/a11y:** scroll-progress + counter are device-tiered (off on low tier); footer is pure server.

### 2. Homepage + ⭐ Living Skill Universe  ·  `1a593d5` (packet: marketing-1-…md)
- **Signature:** the Living Skill Universe hero — centre = You; skill nodes from REAL catalog
  categories (AI+Marketing **live**, Finance/Tech/Skills **coming soon**), SVG+CSS, no WebGL.
- **Honest data:** node live/soon computed from the DB + unit-tested; Learn→Grow scroll-story is
  learning-first (removed the old affiliate step — no earn mechanics on the public site).
- **Proof:** accessibility snapshot + computed-style + interaction test (prior packet).

### 3. Courses list + Course Detail  ·  `50dd2b5`
- **Signature (list):** category "skill map" via real-category filter chips + free-preview signal +
  honest "N live now · more soon". **Signature (detail):** learning-timeline curriculum + a
  verifiable-certificate preview ("proof of skill — never a promise of income").
- **Key files:** `app/courses/page.tsx`, `app/courses/[slug]/page.tsx`, `components/marketing/course-card.tsx`.
- **Honest data:** live catalog; coming-soon handled honestly; sticky buy card + mobile CTA.
- **Proof:** rendered live — real chips (All·AI·Finance·Marketing·Skills·Tech), live/soon/free-preview
  badges, scroll bar. (Staging DB shows ~500 QA test course rows — data pollution, clean in prod.)

### 4. Packages & Pricing (display-only)  ·  `af1b8d1`
- **Signature:** value-framed plan comparison — who-it's-for, savings frame ("every future course for
  ₹X more"), restyled comparison table, payment-trust row (48h refund + secure checkout only — **no
  unverified badges**). Prices/checkout links/composition copy byte-identical from `listPackages`.
  **Zero money logic touched.**

### 5. About  ·  `3485772`
- **Signature:** company-timeline scroll section (honest milestones: Founded 2025 → first courses live
  → 2035 goal). Verbatim frozen Phase-1B founder quote / team / brand statement preserved.

### 6. Contact  ·  `3485772`
- Premium two-column, prominent WhatsApp channel, honest "reply within one business day". `submitContact`
  action + `LeadCaptureForm` untouched.

### 7. FAQ  ·  `3485772`
- **Signature:** searchable + category-filtered `FaqBrowser` (real answers only, honest empty state);
  server JSON-LD retained for SEO.

### 8. Webinar  ·  `ef25ee8`
- **Signature:** live countdown to the REAL next scheduled session + Add-to-Google-Calendar; agenda,
  host card, Friday secondary. `registerWebinar` action + form + Event JSON-LD untouched. **No fabricated
  seats/attendee counts.**

### 9–10. Blog + Videos  ·  `ef25ee8`
- Honest coming-soon states (no fabricated articles/videos) upgraded to the shared shell (scroll-progress
  + premium footer) via the `ComingSoon` component.

### 11. Auth suite (UI-only)  ·  `aeea055`
- **Signature:** premium split-screen `AuthShell` — brand-story/benefits sidebar (dark green→charcoal,
  gold accents valid on dark) + honest company line. Wraps the EXISTING `LoginForm`/`RegisterForm` as
  children. **ZERO auth logic touched** — forms keep their stepper (code→details→otp), OTP input,
  password login, forgot/reset, sponsor auto-detect + DR-040 gating exactly as-is. Applied to /login + /register.
- **Proof:** /login renders the sidebar ("Welcome back") + the login form.

### 12. System pages  ·  `2093d04`
- Premium 404 (shell + aurora + gradient "404" + helpful links + support channel — never a dead end);
  loading skeletons for /courses, /courses/[slug], /packages upgraded to match the new layouts (less CLS);
  shared `page-skeleton.tsx`.

## Honesty-lock checklist (every page) ✓
- [x] Only confirmed badges: Registered LLP (EDZERA INSPIRING EXCELLENCE LLP) · MSME Registered. No
      "Government Approved/Endorsed", no GST, no Startup-India.
- [x] No fabricated counts / testimonials / seats / attendee numbers / outcomes.
- [x] No income promises, no earning mechanics anywhere on the public site.
- [x] Skill nodes, course live/soon, webinar date, prices, categories — all real data + real links.
- [x] Certificate framed as proof of skill, explicitly "never a promise of income".
- [x] "[PLACEHOLDER]" seed titles never surfaced by new components (clean category labels used).

## Perf & a11y notes
- Every new interactive island (Skill Universe, scroll-progress, stat-counter, webinar countdown,
  FAQ browser) is a small client island; pages are otherwise server-rendered → LCP-safe.
- Device-tiering via the single `lib/device-tier` heuristic (reduced-motion / save-data / low-mem /
  no-backdrop-filter) — motion/effects off on low tier; static, legible fallbacks throughout. CLS-safe
  (transform/opacity only). No new dependencies.
- A11y: real `<button>`/`<a>` controls, `aria-label`/`aria-pressed`/`aria-live`, focus-visible rings,
  heading order, ≥44px touch targets, honest empty states. Full screen-reader audit recommended pre-merge.

## Assumptions made (autonomous, low-risk)
1. Homepage hero primary = "Register free", secondary = "Join a free webinar" (per steward decision).
2. Skill Universe reveals "what you'll learn" (not "career outcomes" as the charter illustrated) —
   we have no outcome data and D-29 forbids it. Honest substitution.
3. Course-detail "What you'll learn" outcomes are generic honest capability lines (draft copy) —
   founder finalises; no claims made.
4. Contact/webinar phone + email are the existing Phase-1B `// REPLACE:` temp values — kept as-is.
5. `.claude/launch.json` keeps `autoPort:true` (approved) so parallel sessions get their own port.

## Open questions for founder/steward
1. **Company name discrepancy:** About page's frozen Phase-1B copy says "EDZERA LLP"; the footer + AuthShell
   use the full "EDZERA INSPIRING EXCELLENCE LLP" (overnight instruction). I left the frozen About copy
   untouched — please confirm the canonical string and whether About should be updated.
2. **Newsletter / community footer block:** deferred — there's no real subscribe backend, so building one
   would be fabricated UI. Add when a real list/WhatsApp-community exists.
3. **In-form auth polish** (visual stepper bar, live password-strength meter): deferred because the forms
   are logic-bearing and the rule was "zero server-logic change". Worth a dedicated, carefully-reviewed slice.
4. **Staging data:** the shared Supabase has ~500 QA test course rows that flood /courses. Not a code issue
   (real data), but prod/staging needs a catalog cleanup before launch.

## New dependencies
- **None.** All effects are CSS/SVG; no Lottie/GSAP/Canvas/WebGL/R3F added (charter "no launch R3F" held).

## Skipped / not done
- Purchase-success / registration-complete success pages and `/welcome`, `/onboarding`: these are
  post-auth app surfaces (safety rule: don't touch the dashboard app), so left as-is. The public auth
  *entry* (login/register/OTP/forgot/reset) is done.
- Deep per-form auth UI polish (see open Q3).

## Addendum — GST compliance copy fix (commit `27b23de`, founder-authorized 2026-07-11)
The LLP is **not GST-registered yet** (in-process), so all "GST-inclusive" copy was removed from every
public/marketing/auth surface and replaced with honest "one price · no hidden charges" framing —
homepage, packages, course detail, about, FAQ (page + `faq.ts` incl. the homepage-teaser item), SEO
meta, checkout display line, trust chips/triad/footer/auth-shell, 3 OG images, and the `shape.ts`
comparison table. Scope guard held: **no** money/tax/ledger/webhook/prisma/test change
(`modules/payments/gst.ts`, `GST_PAYABLE`, etc. untouched). tsc + lint + prettier clean; shape test 9/9.
- **⚠️ OPEN — needs founder decision:** `lib/email/receipt.ts` still prints
  `Amount paid: … (GST-inclusive)` on the payment **receipt/invoice**. Per the scope guard ("leave
  invoice/tax backend untouched") I did NOT edit it, but it is customer-facing and carries the same
  compliance risk. Please confirm whether the receipt wording should change too (it's a money-file edit).

## Confirmation
- **Nothing merged. Nothing deployed. No seed run.** All 11 commits are on `gps-marketing`; `main` is
  untouched at b73402c. Working tree clean.
