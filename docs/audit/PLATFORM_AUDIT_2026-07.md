# GoSkilled vNext — Full Platform Audit

**Date:** 2026-07-12
**Branch / commit:** `main` @ `696d493` (latest, after gps-marketing merge) — confirmed clean tree
**Type:** Read-only discovery + audit. **Zero code changes made.** This document is the only file created.
**Method:** 7 parallel domain audits (money/Tier-A · auth/authz/PII/Tier-A · public+honesty · dashboard/LMS · admin · a11y/perf/responsive · spec-conformance) against the frozen specs in `docs/specs/`, `docs/DESIGN_DIRECTION.md`, and the project locks in `CLAUDE.md`. `tsc --noEmit` passes clean.

> **How to read severities.** S1 = broken / critical / legal / security. S2 = significant UX / perf / functional / data-integrity. S3 = polish / cosmetic / doc-drift.
> **Tier tag.** `[Tier-A]` = Money / PII / Compliance / Security — fix decision belongs to founder + Fable Tier-A review; this report describes issue + risk + evidence only and proposes **no** autonomous rewrites. `[Presentation]` = everything else.

---

## 1. Executive Summary

### Platform map

**Public / marketing (18 routes):** `/` (home + Living Skill Universe) · `/about` · `/courses` · `/courses/[slug]` · `/packages` · `/webinar` · `/faq` · `/contact` · `/blog` · `/videos` · `/earn` (waitlist) · `/checkout` · `/login` · `/register` · `/welcome` · `/onboarding` · legal (`/terms` `/privacy` `/refund-policy` `/disclaimer`) · utility (`/verify/[serial]` `/unsubscribe` `/design-system`).

**Student dashboard (`/dashboard/*`, force-dynamic):** `home` · `learn` + `learn/[courseSlug]` (player) · `courses` · `progress` · `profile` · `account/security` · `account/settings` · earn subtree (`earn` · `wallet` · `commissions` · `commission-structure` · `referrals` · `network` + `network/export` · `my-leads` · `leaderboard` · `rewards` · `kyc` + `kyc/doc/[kind]`).

**Admin (`/admin/*`, RBAC):** dashboard · `users` · `payments` · `withdrawals` · `wallet` + `wallet/[userId]` · `kyc` + `kyc/[userId]` + doc route · `catalog` + `catalog/[courseId]` · `leads` · `review-queue` · `rewards` · `settings` · `webinar` · `audit` + `audit/export` · `feature-visibility`.

**API routes:** `/api/checkout` · `/api/webhooks/razorpay`.

**Modules (bounded contexts):** `payments · ledger · wallet · affiliate · lms · kyc · crm · admin · analytics · ai`. **Prisma models (31):** User, Package, Course, PackageCourse, Module, Lesson, Enrollment, LessonProgress, Certificate, Order, WebhookEvent, Affiliate, Referral, LedgerAccount, LedgerTransaction, LedgerEntry, Withdrawal, Kyc, ContactVerification, Lead, Webinar, AdminAction, LessonKnowledge, GuruMessage, Quiz, QuizQuestion, QuizAttempt, EmailLog, RewardDefinition, AffiliateLead, FeatureOverride. **Stack:** Next 15.1 / React 19 / Prisma 6.2 · Supabase Auth · Razorpay · Cloudflare Stream · 630 tracked files · 74 test files.

### Overall health

**The platform is in strong, disciplined shape.** The engineering locks that matter most are verified passing end-to-end:

- **All 7 money locks pass** — paise integers (no floats), commissions credit only from a signature-verified-before-parse idempotent webhook, double-entry balanced legs with ledger-derived balances, DR-025 HELD→AVAILABLE / CLAWBACK lifecycle, D-01 payouts hard-blocked server-side at three layers, thin adapters, Zod at every boundary.
- **Auth/authz is solid** — admin RBAC re-asserted inside every admin mutation (not just middleware), feature-visibility gated server-side and fail-safe, PII AES-256-GCM at rest with fail-closed decrypt, DR-038 masking correct by construction, unsubscribe HMAC timing-safe, webhook raw-body signature verified. DR-024 cleanup confirmed (no `OtpCode` / `passwordHash`).
- **Honesty lock (D-29) passes** — no fabricated testimonials/counts/seats on real public pages, badges limited to "Registered LLP" + "MSME", no income guarantees, legal name consistent, and marketing GST copy already removed.
- **ThreeState rich-honest-zero conforms** across Home/Learn/Earn; `safeMoney`/`safeCount` route money through a single "Couldn't load" atom.
- `tsc` clean; motion near-universally `prefers-reduced-motion`-gated; gold-on-light contrast rule enforced; tables overflow-guarded; icon buttons type-required to carry `aria-label`.

**The gaps are real but bounded.** The two items that would embarrass or expose the business at launch are (1) a receipt/order layer that still books and prints an **18% GST component while the LLP is unregistered**, and (2) an **orphaned unauthenticated `/api/checkout`** that bypasses the invite gate and can mint users + live Razorpay orders. Everything else is significant-but-contained (perf cliffs at scale, one dead admin-UI affordance during D-01, missing error boundaries, timezone) or polish/doc-drift. **No blocker is architectural** — all are localized fixes.

### Top 10 issues

| # | ID | Title | Sev | Tier |
|---|-----|-------|-----|------|
| 1 | M-1 | Receipt email still prints "(GST-inclusive)" while LLP unregistered | **S1** | Tier-A |
| 2 | A-1 | Orphaned public `/api/checkout` bypasses invite gate + OTP + rate-limit | **S1** | Tier-A |
| 3 | X-1 | PWA/app icons are ~15 MB each (~33 MB total), wired into every page — LCP killer | **S1** | Presentation |
| 4 | M-2 | Every Order books an 18% GST split into `Order.gstInPaise` while unregistered | S2 | Tier-A |
| 5 | P-4 | Terms of Service + Privacy Policy are empty "coming soon" stubs (live, linked) | S2 (legal) | Tier-A |
| 6 | FV-1 | `earn` legal launch-gate defaults **VISIBLE** (fail-open) — surfaces live with empty override table | S2 | Tier-A |
| 7 | M-3 | Partial Razorpay refunds trigger full clawback + full enrollment revoke | S2 | Tier-A |
| 8 | P-1 | "Kamao" hero + default OG headline conflicts with the platform's own income-language guardrail | S2 | Tier-A |
| 9 | AD-2 | Admin "Mark PAID" button not D-01-flag-aware — invites out-of-band bank transfer | S2 | Tier-A |
| 10 | TZ-1 | Webinar times + admin "today" boundary render in server TZ, not Asia/Kolkata | S2 | Presentation |

---

## 2. S1 Blockers

### 2A. Money / PII / Compliance / Security (Tier-A)

#### M-1 · Receipt email still states "(GST-inclusive)" while the LLP is not GST-registered · `lib/email/receipt.ts:53,67` · **S1** · Tier-A
The receipt renders `Amount paid: ${amount} (GST-inclusive)` in both the text (line 53) and HTML (line 67) branches. This contradicts the founder compliance lock (`app/packages/page.tsx:3-4`: *"the LLP is NOT GST-registered yet, so NO 'GST-inclusive' copy… Do not re-add GST wording until registration confirmed"*) and the remediation already applied to `/checkout`, `/packages`, and `/faq` (all now say "no hidden charges"). The receipt is the one legally-weighty transactional document and was missed by that sweep.
**Risk:** a customer-facing document asserts GST collection by an entity not authorized to collect it. **Suggested fix (described, not applied):** remove the "(GST-inclusive)" qualifier from both branches; use the approved "one price · no hidden charges" framing; add a unit test asserting no "GST" substring in the receipt. **Effort: S.** *Fix decision: founder + Fable.*

#### A-1 · Orphaned public `/api/checkout` bypasses the invite-only gate, OTP, and rate-limiting · `app/api/checkout/route.ts` · **S1** · Tier-A
The route runs `checkoutStartSchema.safeParse(body)` → `startCheckout(...)` with **no auth, no rate limit, no OTP, and an optional referral code** (`referralCode: z.string()…optional()`, `modules/payments/schemas.ts:14`). `startCheckout` → `resolveBuyer(phone, referralCode)` creates a real `User` row for an arbitrary phone and opens a **live Razorpay order** (`lib/payments/checkout.ts:48-107`) with no sponsor validation. The intended path (`app/checkout/actions.ts`) enforces a valid code, OTP verify, and send-rate throttle. Grep confirms nothing in the frontend calls `/api/checkout` — it is dead but reachable.
**Risk:** violates DR-036/DR-038 invite-only registration; enables unbounded User/Order pollution, phone enumeration, and Razorpay order spam from an unauthenticated caller. **Suggested fix:** delete the unused route, or bring it to parity with `app/checkout/actions.ts` (mandatory code + sponsor gate + OTP + rate-limit + verified session). **Effort: S.** *Fix decision: founder + Fable.*

### 2B. Presentation

#### X-1 · PWA/app icons are ~15 MB each (~33 MB total), wired into every page `<head>` · `public/icons/`, `app/layout.tsx:37`, `app/manifest.ts` · **S1** · Presentation
Measured: `icon-512.png` = **14,996 KB**, `icon-maskable-512.png` = **14,066 KB**, `icon-192.png` = **4,057 KB** (a correct 512px PNG is 10–40 KB). `app/layout.tsx:37` wires the 4 MB `icon-192.png` as both `icon` and `apple-touch-icon`, so **every page** pays it; `manifest.ts` ships all three on install. Directly violates DESIGN_DIRECTION Part A §6 (LCP < 2.5 s on mid-tier Android/4G). On a budget phone over 4G these are multi-second downloads. `manifest.ts:2` flags them as placeholder marks, but they are live.
**Suggested fix:** re-export the brand mark at correct pixel dims + compress (pngquant/oxipng, SVG where possible); target < 40 KB per icon. Also resolves LAUNCH_CONFIG #40. **Effort: S.**

---

## 3. S2 Significant

### 3A. Money / PII / Compliance / Security (Tier-A)

#### M-2 · Every Order books an 18% GST split into `Order.gstInPaise` while unregistered · `lib/payments/checkout.ts:87,94` + `prisma/schema.prisma:88,192` · S2 · Tier-A
`gstRateBps @default(1800)` (schema:88) is never overridden by the seed, so both live packages carry 18%. Checkout computes `gstFromInclusive(pkg.priceInPaise, pkg.gstRateBps)` (checkout:87) and persists `gstInPaise: gst.gstInPaise` (checkout:94) on **every Order row**. The `gst.ts:3` comment even says *"pass gstRateBps = 0 when not registered"* — but nothing passes 0. The figure is **dormant** (written, never read/displayed; the customer-facing GST representation is only the M-1 receipt label), and **GST is never booked to the ledger** (`GST_PAYABLE` is a defined-but-dead account — no `TxSpec` posts a leg to it; the webhook books only `COMMISSION_PAYABLE → USER_WALLET`).
**Risk:** a stored business record asserting collected 18% GST with no basis and no ledger counterpart. **Suggested fix:** set packages' `gstRateBps` to `0` (seed override + flip schema default, or gate the rate behind a `GST_REGISTERED` flag) so `gstInPaise` books 0 until registration; `gstFromInclusive`'s rate-0 path is already correct and tested. Decide with finance whether to keep the column for future use. **Effort: S–M.** *Fix decision: founder + Fable.*

#### M-3 · Partial Razorpay refunds are treated as full refunds · `modules/payments/webhook-flow.ts:91-136` · S2 · Tier-A
The `refund.processed` branch never compares `event.amountInPaise` to `order.amountInPaise` (the amount is captured on the event type but unused). Any dashboard-issued **partial** refund drives `MARK_REFUNDED` + `REVOKE_ENROLLMENTS` + full `CLAWBACK_COMMISSIONS` (in-window) or full revoke + manual flag (post-window) — revoking all course access and clawing back 100% of commissions for a partial money-back.
**Suggested fix:** in the decision engine, branch `event.amountInPaise < order.amountInPaise` → `FLAG_MANUAL_REVIEW` ("partial refund — manual handling"); treat only exact-match as a full refund. Add a decision-table test. **Effort: M.** *Fix decision: founder + Fable.*

#### FV-1 · The `earn` legal launch-gate defaults to VISIBLE (fail-open) · `lib/feature-visibility/registry.ts:64-74` · S2 · Tier-A · *(found independently by admin + dashboard + spec audits)*
`earn.defaultVisible: true`. The DR-040 narrative and the admin page copy frame Earn as "disabled until affiliate legal review clears," but with **no `FeatureOverride` GLOBAL row present**, `resolveFeature` returns the default → the entire affiliate layer (share links, referral attribution display, network, wallet-pending, commission-structure, KYC) is live for every user. `failSafeHidden:true` only helps on resolver *error*, not on the happy-path default. Money stays safe (payouts gated independently by the D-01 env flag), so scope is **surface-visibility only** — but a legal gate that depends on an operator remembering to insert a hide-override is fail-open.
**Suggested fix:** default `earn.defaultVisible: false` (fail-closed) and require an explicit SHOW to launch; or make a GLOBAL hide a hard, boot-asserted launch prerequisite. **Effort: S.** *Fix decision: founder + Fable.*

#### P-1 · "Kamao" hero + default OG headline conflicts with the platform's own income-language guardrail · `app/page.tsx:150`, `app/opengraph-image.tsx:51` · S2 · Tier-A
The homepage H1 is "Seekho. Badho. **Kamao.**" and the default social-share card (every public page) uses the same as its 108px headline. Meanwhile the AI guardrail (`modules/ai/guru/guardrail.ts:19`) and an email test (`tests/email-notifications.test.ts:9`) both classify "kamao/kamai" as income language to be **blocked**, and the PWA manifest deliberately drops it ("Seekho. Badho." only). So the largest public headline + primary share image use the exact earn word the codebase elsewhere treats as a D-29 violation.
**Suggested fix:** founder decision — either bless "Kamao" as an approved brand tagline with a documented guardrail carve-out, or align hero/OG with the manifest to remove earn framing. **Effort: S.** *Fix decision: founder + Fable.*

#### AD-2 · Admin "Mark PAID" button is not D-01-flag-aware · `app/admin/withdrawals/page.tsx:87`, `components/admin/withdrawal-actions.tsx:39` · S2 · Tier-A
`canMark={kycOk && amountOk}` never considers `payoutsEnabled()`. During the D-01 OFF window the button renders enabled and the confirm dialog says "Confirm you have ALREADY transferred this amount via bank." An operator can perform the real bank transfer, click Mark PAID, and only then hit the server's `PAYOUTS_DISABLED` rejection — a real-money transfer with **no ledger record**. The money-move itself is correctly blocked server-side (`canMarkWithdrawalPaid`, `modules/wallet/withdrawal.ts:87`); the UI invites the out-of-band transfer.
**Suggested fix:** pass `payoutsEnabled()` into the page, disable Mark PAID + show a "Payouts disabled (D-01)" banner, gate the confirm dialog on it. **Effort: S.** *Fix decision: founder + Fable.*

#### P-4 · Terms of Service and Privacy Policy are empty "Content coming soon" stubs · `app/terms/page.tsx:14-17`, `app/privacy/page.tsx:14-19` · S2 (legal) · Tier-A
Both render only "Content coming soon… before launch," yet are linked in the footer, referenced by checkout, and cited by the FAQ ("Detailed eligibility terms on the Terms page", `lib/marketing/faq.ts:76`). For a site collecting phone/OTP and taking Razorpay payments, live-but-empty Terms/Privacy is a compliance gap. (Refund + Disclaimer, by contrast, have real substantive copy.) Tracked as LAUNCH_CONFIG #2/#3.
**Suggested fix:** publish real Terms + Privacy before go-live; until then the FAQ cross-reference is unsupported. **Effort: M (content/legal).** *Fix decision: founder + legal.*

### 3B. Presentation

#### TZ-1 · Dates render in server timezone, not Asia/Kolkata · `app/dashboard/home/page.tsx:195,275,283`; `lib/admin/queries.ts:51-52`; `components/admin/primitives.tsx:174-185` · S2 · *(admin + dashboard audits)*
Webinar times use date-fns local TZ (`format(startsAt, "h:mm a")`), and the admin "today" boundary uses `setHours(0,0,0,0)` in server-local time; admin table formatters call `Intl.DateTimeFormat("en-IN")` with **no `timeZone`**. On a UTC host an 8:00 PM IST session shows as 2:30 PM, and "signups/revenue today" is measured from 05:30 IST. `app/admin/rewards/page.tsx:18` and the earn pages correctly pin `Asia/Kolkata` — proving the intent is unmet elsewhere. Server-rendered, so no hydration crash — a correctness/consistency bug.
**Suggested fix:** centralize `timeZone: "Asia/Kolkata"` in shared formatters; compute day boundaries in IST. **Effort: M.**

#### EB-1 · No dashboard-scoped or admin-scoped error boundary · `app/dashboard/**`, `app/admin/**` (no `error.tsx`) · S2 · *(admin + dashboard audits)*
Only the global `app/error.tsx` exists. A single failed query on any earn/admin slice (e.g. `getReferralTree`, the unbounded KPI loads) bubbles to the full-page global boundary, dropping the entire shell/nav — contradicting `app/admin/loading.tsx:1`'s stated "empty/skeleton/error/retry" contract and the ThreeState "degrade to Couldn't load" rule (which is realized only for money/count *atoms* via `DataValue`, and only where wired).
**Suggested fix:** add `app/dashboard/error.tsx` and `app/admin/error.tsx` with a `reset()` retry that preserves chrome; consider per-slice Suspense+error on Home/Earn. **Effort: M.**

#### A11Y-1 · Shared Modal & Drawer primitives have no Tab focus-trap · `components/ui/modal.tsx:37-53`, `components/ui/drawer.tsx:41-56` · S2 · Presentation
Both set `role="dialog"` + `aria-modal`, move/restore focus, lock scroll, close on Escape — but neither wraps Tab / Shift+Tab, and the background isn't `inert`/`aria-hidden`, so focus escapes into background content. This is exactly the gap `PRODUCT_DEBT #9` fixed for the Guru panel, but that fix never landed in these shared primitives (which back `confirm-dialog`, the mobile nav drawer, and bottom sheets app-wide). WCAG 2.4.3 / 2.1.2.
**Suggested fix:** add a focus-trap cycling focusable nodes within `panelRef`; mark siblings `aria-hidden`/`inert` while open; reuse the Guru-panel implementation. **Effort: M.**

#### H-1 · Open SSR/client hydration attribute mismatches (console errors) · `/login`, `/dashboard/earn`, `/dashboard/earn/referrals`, `/admin/users` · S2 · Presentation
`PRODUCT_DEBT QA-3/5/6/7` (all OPEN): "tree hydrated but some attributes… didn't match." Reclassified as engineering-correctness tickets but unresolved; they emit console errors on 4 routes including `/login` and `/admin/users`.
**Suggested fix:** root-cause the mismatched attribute per route (candidates: time/locale-derived values, extension `data-*`, conditional client-only attrs). **Effort: M.**

#### D-4 · KYC submit not gated on completed email/WhatsApp verification · `components/affiliate/kyc-form.tsx:178`, `app/dashboard/earn/actions.ts:93-138` · S2 · Tier-A
The submit button is only `disabled={busy}`; `emailOk`/`waOk` are advisory tips. `kycSchema` validates PAN/account/IFSC/holder/bank/docType but **not** the verified-contact flags, and `submitKyc` never checks them — a user can submit KYC with unverified/absent contact channels, contradicting the form's "each channel verified by code" intent.
**Suggested fix:** enforce `emailVerified && whatsappVerified` server-side in `submitKyc`; disable client submit until both true. **Effort: S.** *Fix decision: founder + Fable (PII/KYC path).*

#### D-5 · Course-player enroll CTA hardcodes `package=career-booster` · `app/dashboard/learn/[courseSlug]/page.tsx:106` · S2 · Presentation
`<Link href="/checkout?package=career-booster">` on the locked-lesson card regardless of which package actually unlocks the course. If the locked course isn't part of Career Booster, the buyer is routed to the wrong package.
**Suggested fix:** derive the correct package slug from the course/entitlement view instead of a literal. **Effort: S/M.**

#### AD-1 · Admin dashboard KPI builder loads entire tables into memory · `lib/admin/kpi.ts:34-49` · S2 · Presentation
`user.findMany`, `order.findMany`, and two `ledgerEntry.findMany` all with **no `take`**, bucketed in JS on every load of the default admin landing page. At tens of thousands of rows this is a memory + latency cliff. (Related: AD-9 review-state and AD-10 wallet-list also scan unbounded.)
**Suggested fix:** push bucketing into SQL (`groupBy`/`$queryRaw` with `date_trunc`) or bound to a rolling window + `take`. **Effort: M.**

#### AD-4 · Quiz draft save persists an unvalidated question payload · `app/admin/catalog/quiz-actions.ts:17-27`, `lib/admin/quiz.ts:156,168` · S2 · Presentation
`saveQuizDraftAction` passes `input` straight through with **no Zod boundary**; `saveQuizDraft` validates only `title` + `passPercent`, writing `questions[].correctIndex`/`options`/`prompt` verbatim. A malformed `correctIndex` (out of range/negative) or empty `options` is persisted to a draft (only `publishQuiz` validates later). This is the one admin action lacking a Zod boundary on a structured object.
**Suggested fix:** add a Zod schema (prompt non-empty, ≥2 options, `0 ≤ correctIndex < options.length`, passPercent 1–100). **Effort: S.**

#### R-1 · Course player horizontal overflow at 320/360 · `app/dashboard/learn/[courseSlug]` · S2 · Presentation
`PRODUCT_DEBT QA-4` (deterministic): 6px H-overflow at 360 on the player, violating 320px-first. The video has a `min-w-0` guard; the offending child is elsewhere in the grid. **Effort: S.**

#### R-2 · CLS budget misses on `/packages` (0.144) and `/faq` (0.210) at 360 · S2 · Presentation
`PRODUCT_DEBT QA-1/QA-2` (OPEN). Dev-server over-reports CLS — confirm on a production build — but `/packages` is the money page. **Suggested fix:** reserve space for late-shifting fonts/images/accordions. **Effort: S–M.**

#### P-2 · Internal `/design-system` page is publicly reachable, un-noindexed, and shows fabricated demo stats · `app/design-system/page.tsx` · S2 · Presentation
The page is `"use client"`, so the "noindex" claimed in its header comment is **not applied** (a client component can't export `metadata`); `middleware.ts:38-42` guards only `/dashboard` + `/admin`; `robots.ts:10` doesn't disallow `/design-system`. It renders fabricated social proof (`StatValue value={1240}… learners`, "Rahul joined with your link"). Unlinked but directly reachable and crawlable — a D-29 surface if indexed.
**Suggested fix:** add `/design-system` to `robots.ts` disallow + gate it (middleware/env) to 404 in production, or move it out of the app router. **Effort: S.**

#### P-3 · Dead link "See how verification works →" points to non-existent `/verify` · `app/courses/[slug]/page.tsx:284` · S2 · Presentation
Only `app/verify/[serial]/page.tsx` exists; `/verify` with no serial 404s for anyone clicking the certificate-preview CTA on **every** course-detail page.
**Suggested fix:** point at a real target (FAQ cert answer / detail anchor) or add a `/verify` index. **Effort: S.**

#### SC-1 · Notifications bell is a dead control; no notifications-history surface · `components/nav/app-shell.tsx:217` · S2 · Presentation · *(spec + dashboard audits)*
`<IconButton aria-label="Notifications"><Bell/></IconButton>` has no `href`/`onClick`/popover, and no `/dashboard/**/notifications` route exists — yet IA Blueprint §5.1 marks it BUILT and Nav v1.1 §60 treats it as a real global bell. A non-functional affordance / dead end.
**Suggested fix:** wire a notifications panel/route, or hide the bell until built and reclassify IA §5.1 as NEW. **Effort: M.**

---

## 4. S3 Polish

**Auth defense-in-depth (Tier-A):**
- **A-2** — no app-level throttle on OTP *verify* (only *send*); brute-force of the 4–6 digit code relies solely on Supabase limits (`login/register/checkout actions`). Add per-phone+IP throttle before `verifyOtp`. S.
- **A-3** — CSV formula injection: `csvCell` (`lib/affiliate/network.ts:172`, `lib/admin/audit-log.ts:78`) quotes only on `",\n` — values starting `= + - @` (a downline's self-set `User.name`) execute in Excel/Sheets on export. Prefix such cells with `'`. S.
- **A-4** — `safeNext` open-redirect: backslash bypass (`/\evil.com` passes the `//` check, browsers normalize to protocol-relative) (`lib/auth/post-auth.ts:15`). Reject/normalize backslashes. S.
- **A-5** — certificate OG-image route unthrottled while the page is rate-limited (`app/verify/[serial]/opengraph-image.tsx:25`) — enumeration backstop gap (mitigated by ~49-bit serials). Apply the same per-IP limit. S.
- **A-6** — recipient email logged in console-email mode (`lib/email/provider.ts:22`) — PII in prod logs if `EMAIL_PROVIDER=console`. Mask recipient or hard-fail console mode in prod. S.
- **AD-11** — `resolveReview` lacks existence check + idempotency (`lib/admin/review.ts:7`): can resolve an arbitrary orderId; repeated clicks create duplicate resolved rows. S.
- **AD-12 / D-13** — several id/boolean admin actions are presence-only, not Zod-validated (`withdrawals/kyc/rewards/webinar actions`); My-Leads shows owner full decrypted phone (`my-leads/page.tsx:100`, flagged for Fable — LAUNCH_CONFIG #52 retention policy). S.

**Presentation:**
- **AD-5** — `/admin/payments` + `/admin/leads` capped at 100 with no pagination (older rows unreachable); users + audit *are* paginated. Add skip/take pager. M.
- **AD-7-badge (AD-8)** — feature-visibility effective-state badge ignores role/user hide-wins overrides; can mislead an operator. Label as "global/default" + show override counts. S.
- **AD-14** — deep-page `notFound()` renders the global shell (no `app/admin/not-found.tsx`), dropping admin chrome on a mistyped id. S.
- **D-6** — commission-structure page dead-ends the "See the commission structure →" CTA behind the payouts-off pending card; show the honest 3-level structure pre-D-01 or change CTA copy. S.
- **D-8** — referral share URL inconsistent: `/?ref=` (`referrals/page.tsx:15`) vs the canonical `/register?ref=` everywhere else — attribution/OG drift. Standardize. S.
- **D-10** — Wallet/Commissions/Commission-Structure render `formatINR(...)` directly instead of routing flag-on money through `safeMoney`→`DataValue`; contained (server-computed, throws to boundary rather than printing ₹0) but outside the single choke point + no inline Retry. S/M.
- **D-11** — Learn "Overall progress" shows a bare number (`45`) for a percentage; `%` only in hint text. Format as percent. S.
- **D-12** — onboarding "done" view unconditionally claims "full course access unlocked" + "48-hour refund"; confirm `/onboarding` is post-purchase-only or make the lines conditional on real entitlement (D-29, low confidence). S verify / M gate.
- **C-1 / C-2** — off-token raw hex in runtime components (`components/dashboard/progress-ring.tsx:36,44`, `components/data/flame.tsx:27`, `components/ui/confetti.tsx:7`) + a duplicated progress-ring primitive (`dashboard/` raw-hex copy vs on-token `data/` copy). Consolidate on the `data/` version. S.
- **C-3** — ~40 `text-red-600` + ad-hoc form fields not yet migrated to the built `Alert`/`FormField` primitives (`PRODUCT_DEBT #15`, deferred per DR-031). M.
- **H-3** — index keys (`key={i}`) on dynamic **data** rows (`home:303`, `commissions:97`, `network:180,217`, `referral-tree:48`) — reconciliation risk if lists reorder/animate. Key by stable id. S.
- **P-5** — public "Watch free →" links route to auth-gated `/dashboard/learn/...` (bounced to `/login`), so the free-preview promise isn't met pre-auth. Route to a public preview or relabel. M.
- **P-6** — `/packages` "limited founding seats" asserts a countable cap; align with the homepage's softer wording unless a cap is enforced (D-29-adjacent). S.
- **P-8** — checkout: submit gated only on `refCode.length<3` (phone not validated to 10 digits client-side; server re-validates); OTP input `maxLength={8}` while copy says "6-digit." S.
- **P-9** — register/login/checkout describe credential handling three ways ("and a password" vs "no password to remember" vs "No password needed"); harmonize the public promise. S.
- **P-2-stats** — `/design-system` demo stats (also see P-2). 

**Perf / dep hygiene:**
- **X-P2** — `framer-motion@^11` declared but never imported (all motion is CSS); remove the dead dependency or adopt it. S.
- **X-P3** — one raw `<img>` (avatar, deliberate, lazy + alt) — acceptable, noted. 

**Spec / doc drift (S3):**
- **SC-2 / SC-3** — IA §5.1 Activity Feed and §5.3 referral drill-down (`/earn/network/[referralId]`) marked BUILT but absent; either build or reclassify NEW.
- **SC-5 / SC-6 / SC-8** — IA Blueprint's 6-workspace/`/marketplace`/`/ai` model and Amendments §A (Guru-as-workspace, Explore) are superseded by the later Nav v1.1 LOCK but still stamped FROZEN/BINDING and never reconciled; stale "Guru entry" JSDoc in `topbar.tsx:8,16` and `dashboard/layout.tsx:2`. Add superseded-by banners; scrub comments.
- **SC-9 / SC-10 / SC-11** — orphan duplicate routes `/dashboard/earn/referrals` (dup of `/network`) and `/dashboard/earn/commissions` (dup of Wallet ledger), not linked anywhere; dead `components/nav/bottom-nav.tsx` (never imported). Delete or redirect to hold the anti-duplication rule. S.
- **SC-7** — public header nav (Courses·Packages·Webinar·Earn·About·FAQ) diverges from IA §6 (…About·Contact); Contact dropped, FAQ/Earn added. Add Contact or accept the set. S.
- **SC-4** — Account "Support" points at the public `/contact` rather than an in-app help surface. S.
- **DEBT** — one tracked code TODO (`app/admin/page.tsx:181`, GPS-M5 slot); `[PLACEHOLDER]` launch course titles/transcripts (`prisma/seed.ts:74,109,116` — intentional, DR-029-compliant, content dependency); open `PRODUCT_DEBT` rows #1/#2/#4/#6/#7/#8.
- **M-4** — stale e2e assertion expecting removed GST FAQ copy (`e2e/public-smoke.spec.ts:60-62`) — will fail and re-encodes non-compliant wording; delete/replace. S.
- **M-5** — receipt + `purchase` analytics fire post-commit (`lib/payments/webhook.ts:350`); a crash in that window drops them permanently on retry (early idempotency guard returns first). Low probability; consider an outbox/`receiptSentAt` reconcile. M.

---

## 5. Per-Surface Findings Index

- **Public / marketing:** P-1, P-2, P-3, P-4, P-5, P-6, P-8, P-9, SC-7, X-1 (icons in layout), M-4. *Honesty lock PASS; missing-state coverage solid; branded 404/500 with no dead ends.*
- **Auth (login/register/checkout/onboarding):** A-1, A-2, A-4, D-12, P-8, P-9, H-1 (`/login`). *Invite-only + first-touch attribution + generic no-enumeration errors verified.*
- **Dashboard shell / nav:** SC-1 (dead bell), SC-8/9/10/11, D-7 (orphans), D-8, D-9. *Nav conforms to Nav v1.1; Guru dormant; `/dashboard`→`/dashboard/home` works.*
- **LMS (learn / player / courses / progress):** D-5, D-11, R-1, DEBT-3 (placeholder content). *Signed-URL player, enrollment gating, progress, certificate slot present.*
- **Earn subtree:** FV-1, D-6, D-10, A-3 (network export), D-13 (My-Leads PII), SC-2/3. *Eligibility fork, honest range, PayoutStatusLine, D-01 gating all conform.*
- **Payments / webhook / ledger / wallet:** M-1, M-2, M-3, M-5. *All 7 money locks pass; idempotency layered; upline capped at 3; DR-038 eligibility inside tx.*
- **KYC / withdraw:** D-4, AD-2, A-5(cert), A-6, D-13/#52. *PII AES-256-GCM fail-closed; doc routes 403/rate-limited/reveal-logged; 60 s signed URLs.*
- **Admin console:** AD-1, AD-2, AD-4, AD-5, AD-8, AD-11, AD-12, AD-14, EB-1, TZ-1. *Audit-row coverage complete; RBAC re-asserted per action; D-01 gate holds server-side.*
- **Notifications / search / activity:** SC-1, SC-2 (both absent/dead — surfaces spec'd BUILT but not implemented).
- **Cross-cutting nav integrity:** no hard 404s in switcher/sidebar/cards; softer issues are P-3, D-5, D-6, D-8, D-9, SC-9/10.

---

## 6. Cross-Cutting Assessment

### Performance
- **S1:** ~33 MB of PWA icons, one wired into every page head (X-1) — measured, the single biggest Core-Web-Vitals liability. Fix drops it to < 120 KB total.
- **Server hot paths:** admin dashboard KPI (AD-1), review-state (AD-9), wallet-list (AD-10) all do unbounded `findMany` + JS bucketing — fine now, cliff at scale. `/admin/payments` + `/admin/leads` capped at 100 (AD-5).
- **Bundle:** clean — no chart libs (hand-rolled SVG), self-hosted subsetted fonts with `display:swap`, correct static/`force-dynamic` split, Suspense on heavy hubs, `framer-motion` unused (tree-shaken; remove per X-P2).
- **CLS:** `/packages` 0.144 + `/faq` 0.210 at 360 (R-2) — verify on prod build.

### Accessibility (WCAG AA)
- **S2:** shared Modal/Drawer lack a focus-trap (A11Y-1) — the one systemic keyboard gap. **PASS:** skip-link present, `IconButton` type-requires `aria-label` and is ≥44px at md/lg, toasts `aria-live`, global `:focus-visible` ring, confetti silenced under reduced motion, **gold-as-text contrast clean** (all gold text uses AA-safe `text-warning-strong`; `text-gold` only decorative on dark). Motion near-universally `prefers-reduced-motion`-gated.

### Responsive
- Course-player 6px overflow at 360 (R-1); otherwise strong — every data table `overflow-x-auto` + `min-w`, bottom-nav ≥56px, fixed widths confined to `md:` desktop rails.

### Honesty-lock (D-29) audit result — **PASS**, with 3 flagged risks
- **Clean:** legal name "EDZERA INSPIRING EXCELLENCE LLP" consistent; badges limited to "Registered LLP" + "MSME" (no Government/Startup-India/GST-endorsement); no marketing GST/"inclusive"/"18%" copy anywhere in `app/` or `components/` (the only GST hits are compliance comments forbidding it); no income guarantees; no fabricated testimonials/counts/seats on real public pages (homepage explicitly refuses fake testimonials).
- **Flagged:** M-1/M-2 GST in the receipt/order layer (backend, Tier-A); P-1 "Kamao" earn word vs the platform's own guardrail; P-2 `/design-system` fabricated demo stats reachable + crawlable; P-6 "limited founding seats" scarcity.

### Money / masking / feature-visibility locks — verified
- **safeMoney/safeCount** enforced through one `DataValue` atom (real ₹0 honest, null → "Couldn't load"); no count-up on money; commission shown as an honest **range** `₹150–₹250`, never a promise (D-10 lists surfaces that bypass the atom but stay contained).
- **Payouts OFF (D-01):** no reachable live "Paid" / enabled withdraw while the env flag is off — blocked at request, mark-paid money-move, and every UI surface (the one gap is the AD-2 *button-state* invitation, not an actual money move).
- **DR-038 masking:** L2/L3 selects never read name/phone (private by construction); L1 mobile masked, full number server-side only; export refuses `level!=="1"` + rate-limited.
- **Feature-visibility:** server-enforced (earn layout → `notFound()`, every action + the two owner/earn route handlers re-assert), hide-wins, fail-safe-hidden on DB error, referral code stripped from client payload when hidden. The only issue is the fail-**open default** (FV-1).

---

## 7. Open Questions for the Founder

1. **GST (Tier-A, decide first).** The receipt prints "(GST-inclusive)" (M-1, S1) and every Order stores an 18% `gstInPaise` (M-2). Confirm: until GST registration, zero the rate + strip the receipt label? (GST is *not* booked to the ledger, so no double-entry impact — this is representation + stored-record only.)
2. **"Kamao" (P-1).** Is "Seekho. Badho. Kamao." a blessed brand tagline (needs a documented guardrail carve-out), or should the hero/OG drop it to match the manifest's "Seekho. Badho."?
3. **`earn` visibility default (FV-1).** Flip `defaultVisible` to `false` (fail-closed legal gate), or keep it open and treat a GLOBAL hide-override as a hard, boot-asserted launch prerequisite?
4. **`/api/checkout` (A-1).** Delete the orphaned route, or is it a planned integration that should be brought to parity with the OTP/invite path?
5. **Legal pages (P-4).** Terms + Privacy are empty stubs but live and linked — timeline to publish real copy? (LAUNCH_CONFIG #2/#3.)
6. **My-Leads PII (D-13 / LAUNCH_CONFIG #52).** Owner currently sees full decrypted downline phone/email; confirm the retention/masking policy before launch.
7. **Partial refunds (M-3).** Confirm the desired behavior: route partial Razorpay refunds to manual review (recommended) rather than full clawback + full access revoke?
8. **Orphan earn routes (SC-9/10).** Remove `/dashboard/earn/referrals` + `/commissions`, or wire them into nav intentionally?
9. **Spec reconciliation.** IA Blueprint + Amendments §A still describe the superseded 6-workspace/Guru model as FROZEN/BINDING. Approve adding "superseded by Nav v1.1" banners so the doc corpus stops contradicting itself?

---

## Appendix — Launch gate status (from LAUNCH_CONFIG.md, unchanged by this audit)

**No PENDING rows may remain at go-live.** LAUNCH-blocking PENDING rows span: legal (#2–6), content (#7–11, #34, #37, #39, #44, #45, #49), config (#17, #18, #28, #38, #41, #50), external services (#19–22, #24, #25, #35, #36, #47, #48), business (#26, #27, #42), process (#30), and the Fable-gated My-Leads PII policy (#52). `#1` (D-01 affiliate legality) + `AFFILIATE_PAYOUTS_ENABLED` stay false until counsel clears. **`GO_LIVE_CHECKLIST.md` is entirely unchecked**; note the KYC verify-send provider (#47) is flagged "not built" (a real delivery integration, not just a config flip). This audit found **no architecture blocker** to launch.

*End of report. No code, config, data, or branch was modified in producing it.*
