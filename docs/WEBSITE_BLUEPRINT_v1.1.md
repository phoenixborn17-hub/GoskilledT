# GoSkilled Website — Blueprint v1.1 (FROZEN)

### Architecture · Flows · Data Model · Design System · Launch-critical specs

**Status:** **FROZEN v1.1** — implementation-ready · **Date:** 2026-07-03
**Owner:** Founder · **Steward:** Claude · **Canonical home:** KB-08 Website
**Supersedes:** `Website_Blueprint_PhaseA_v0.1` (reconciled with vNext ADR per Design Review Board v1.0 blocker C1)
**Maps to:** KB-08 · KB-14 (vNext ADR) · KB-07 Brand (DR-012) · KB-05 Product · KB-10 Sales · KB-11 Affiliate
**Repo:** **`goskilled-vnext`** (DR-019) — Next.js 15 · TS · Tailwind + shadcn · Prisma + Supabase Postgres · Supabase Auth · Razorpay · double-entry ledger
**Operating model:** solo founder + Claude Code (DR-020). Design north-star: `goskilled-vnext/docs/DESIGN_DIRECTION.md`.

> **The website is the product OS surface.** It instantiates the customer journey, business logic, LMS, affiliate engine, admin, CRM and analytics. Blueprint defines the whole system; we build launch-critical surfaces first (Phased Activation).

---

## 1. Ratified decisions embedded in this version (v0.1 → v1.1)

| Ref        | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DR-019/020 | vNext greenfield (`goskilled-vnext`), Next 15 stack, solo + Claude Code. All legacy `goskilled-web` references superseded; legacy repo = reference only.                                                                                                                                                                                                                                                                                                                                                                   |
| **DR-021** | **Packages:** Skill Builder = 1 launch course (buyer's choice AI _or_ DM). Career Booster = both + all future courses as released (roadmap honestly labeled).                                                                                                                                                                                                                                                                                                                                                              |
| **DR-022** | **Video = Cloudflare Stream** (signed URLs, HLS adaptive). YouTube-unlisted only for free previews.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **DR-023** | **Checkout = OTP-inside-checkout** (phone → OTP → pay; account is a by-product; name/email post-purchase). **GST-inclusive single price** ("₹X — no hidden charges").                                                                                                                                                                                                                                                                                                                                                      |
| **DR-024** | **Auth = Supabase Auth for users AND admins** (role claim + RBAC). `OtpCode` + `AdminUser.passwordHash` removed from schema.                                                                                                                                                                                                                                                                                                                                                                                               |
| **DR-025** | **Refunds = 48-hour window + commission hold (refined).** Lifecycle: payment ⇒ commissions **HELD** → 48h → no refund ⇒ **AVAILABLE**; refund ⇒ **CANCELLED** via `clawback` ledger reversal (never becomes available). Post-window exceptional refund = **manual**: negative ledger entry adjusts _future earnings_ — **never pull money back from the bank**. **Held commissions are visible to affiliates but not withdrawable until the refund validation window expires** (UX rule — wallet shows Held vs Available). |

## 2. Scope discipline — architect all, build launch-critical first

|                      | Launch-critical (build now — Slice 1)                                                                                              | Design-only / build later                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Marketing**        | Home, Courses, Course detail, Packages, Webinar                                                                                    | Blog, Videos, Success stories, About, Contact, FAQ             |
| **Legal**            | Privacy · Terms · **Refund (48h, DR-025)** · Disclaimer — required for Razorpay activation; content owned by D-01 legal workstream | —                                                              |
| **Auth**             | Supabase phone-OTP (inside checkout + standalone login)                                                                            | —                                                              |
| **LMS (green)**      | Dashboard, My courses, Course player (Cloudflare Stream), Progress                                                                 | Certificates + `/verify/[serial]`, Assignments, Leaderboard    |
| **Affiliate (gold)** | _Designed fully; signup/earnings GATED by D-01_ — dashboard, referrals, wallet (held/available split)                              | Commissions detail, Payouts, KYC, Rewards (Slice 2, post-D-01) |
| **Admin**            | Users, Payments, Leads + **`AFFILIATE_PAYOUTS_ENABLED` master flag**                                                               | KYC, Withdraw, Popups, Rewards, Webinar admin, Settings        |

## 3. Surfaces & sitemap (vNext routes)

- **Marketing** `(marketing)/`: `/` · `/courses` · `/courses/[slug]` · `/packages` · `/webinar` · `/earn` (waitlist while D-01 gated) · `/privacy /terms /refund-policy /disclaimer` · (later: `/blog /videos /success-stories /about /contact /faq`).
- **Auth**: `/login` (Supabase OTP) · registration happens inside checkout (DR-023) · `/onboarding` (post-purchase: name, email, goal — skippable).
- **LMS (green)** `/dashboard`: `/dashboard/courses` · `/dashboard/learn/[courseSlug]` (player) · `/dashboard/progress`.
- **Affiliate (gold)** `/dashboard/earn`: `/referrals` · `/wallet` (held vs available) · (Slice 2: `/commissions /payouts /kyc`).
- **Admin** `/admin`: `/dashboard /users /payments /leads /settings` (Slice 1 minimum).
- **Mobile nav:** bottom tab bar — **Learn · Progress · Earn · Profile** (desktop sidebar collapses to it).

## 4. Customer journey & money flow

```
Visitor ─(webinar/free content//earn)→ Lead ─(checkout: phone→OTP→pay)→ Customer
                                              │ Razorpay webhook (signature + idempotent)
                                              ▼ payment→access ≤60s
                                           Student (LMS green)
                                              │ commissions credit L1/L2/L3 (DR-007)
                                              │   → HELD 48h (DR-025) → available
                                              ▼
                                           Affiliate (gold; payouts OFF until D-01)
Refund ≤48h ⇒ Order REFUNDED + clawback txn reverses all 3 commission legs.
```

**Failure paths are part of the spec:** OTP non-delivery → resend timer → WhatsApp-OTP/email fallback → change number. Payment failure → retry → order-recovery page → WhatsApp support deep-link. Every §7 page ships empty/loading/error states (one-line spec each in build tickets).

## 5. Data model — deltas on the scaffold schema

Bounded contexts per vNext ADR §4. Changes ratified by this freeze:

- **Remove** `OtpCode`, `AdminUser.passwordHash` (DR-024) — admin = Supabase role claim; keep `AdminAction` audit (actor = Supabase user id).
- **Ledger:** `LedgerTransaction.type` → enum incl. `"clawback"`; add `holdUntil DateTime?` on commission credit legs (or a `HELD` flag) — **available balance = sum(entries) where holdUntil passed**; DB CHECK/trigger enforcing zero-sum per transaction; monthly reconciliation job.
- **Package:** CB future-inclusion flag (DR-021); SB course-choice recorded on Order.
- **Lead:** dedup key + `utmSource/utmMedium/utmCampaign` (KB-10 handoff contract).
- **Lesson:** `videoAssetId` = Cloudflare Stream UID (DR-022).
- `Affiliate.status`, `Lead.stage` → enums.
- Withdrawal single-pending → partial unique index in first migration (not a TODO).
- **Backups:** Supabase PITR enabled before live money.

## 6. Design system (north-star: DESIGN_DIRECTION.md)

- **Tokens:** green `#137E49` · gold `#EDC825` · charcoal `#2A302A` · off-white `#FEFEFE` · Sora/Inter/Noto Devanagari (subset + `font-display:swap`). Complete before page builds: neutrals ramp, semantic colors, spacing/radius/shadow scale, shadcn theme map.
- **Gold rule (a11y):** gold is **never text on light backgrounds** (1.7:1). Gold = fills/accents/badges with charcoal text, or text on charcoal (≈8:1).
- **Theming:** one component system, dual token sets — Marketing+LMS green-forward · Affiliate gold-forward (`[data-theme="affiliate"]`) · Admin charcoal. Dark mode deferred to Slice 3 (explicit).
- **Motion:** CSS + Intersection Observer + View Transitions; Framer Motion on marketing routes only; `prefers-reduced-motion`; every effect has a job. ≤1 immersive hero moment, lazy, with static fallback — only after LCP budget proves headroom.
- **Language:** single Hinglish locale at launch; Devanagari rendering supported; full Hindi i18n = Slice 3 (`next-intl`).

## 7. Launch-critical page specs (Slice 1)

- **Home** — hero ("Seekho. Badho. Kamao." + ONE primary CTA: cold → Webinar; secondary ghost → Packages), trust strip (founder identity, GST invoice, 48h refund, "no income guarantees" stated proudly — D-29 as brand), launch courses, learn-and-earn explainer, testimonials, FAQ.
- **Courses / Course detail** — grid (2 launch prominent, rest "coming soon"); detail = outcomes, curriculum, instructor, price (GST-inclusive), free-preview lesson (YouTube ok), CTA. No income claims (D-29).
- **Packages (the money page)** — SB vs CB comparison table per DR-021, recommended-tier highlight, savings math, testimonials adjacent to CTA, on-page FAQ (refund/GST/access), **sticky mobile CTA bar**.
- **Checkout** — one screen: package summary (SB: course choice) → phone → OTP → Razorpay. ≤3 inputs before pay. Success: confetti + "Start learning" (access ≤60s) → onboarding (name/email/goal).
- **LMS dashboard + player** — continue-learning, progress ring; player = Cloudflare Stream HLS, lesson list, mark-complete, resume. Empty state = "Start Lesson 1" of purchased course, never blank.
- **Affiliate dashboard (gated)** — earnings summary with **held vs available** split, 3-level referral tree, referral link; payouts state = designed D-01-compliant message. `/earn` public page = waitlist capture.
- **SEO baseline (launch pages):** metadata + OG images, Course JSON-LD, sitemap.xml/robots, canonicals.
- **Analytics:** ~15 canonical events (`view_package, begin_checkout, purchase, lesson_complete, referral_share…`) → PostHog free tier + Vercel Analytics.

## 8. Execution plan

| Slice               | Work                                                                                                                                                            | Gate                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **1 (launch)**      | Money core (ledger+hold+clawback, webhook) → auth (Supabase) → catalog/LMS (Stream player) → checkout → marketing pages → minimal admin + payout flag           | this freeze · ₹1 test · legal pages live |
| **1.5 fast-follow** | Guru v1 (course-transcript RAG, Hinglish, D-29 guardrails, cost caps) · quiz-gen (admin-side) · webinar WhatsApp nurture · certificates + `/verify` · PWA shell | Slice 1 live                             |
| **2 (post-D-01)**   | Affiliate activation, KYC, withdraw, full admin                                                                                                                 | **D-01**                                 |
| **3**               | Dark mode · Hindi i18n · offline lessons · community · 3D hero · adaptive paths                                                                                 | data/headroom                            |

**Parallel non-website critical path (unchanged, true bottleneck):** D-01/03/04 legal · **course recording (AI + DM)** · D-26 IP.

## 9. Division of labour (two-account workflow)

- **Fable/Max ("Chief Architect"):** architecture, design decisions, reviews, money-code review before merge, final audits. Never production code.
- **Claude Pro + Claude Code ("Development"):** implementation ticket-by-ticket. Every session starts: _"Implement per frozen Blueprint v1.1 + CLAUDE.md. Do not redesign."_ Money modules (ledger/commission/webhook/clawback) require Fable review + Vites
