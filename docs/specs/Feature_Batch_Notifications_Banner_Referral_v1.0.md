# Feature Batch v1.0 — Notifications · Admin Promo Banner · Referral Tracking

**Status:** Approved (founder decisions 2026-07-16) · **Tier:** all three are **Tier-A** (schema
migrations + money/KYC/attribution + admin CRUD + learner-facing blast radius). Build parked, never
self-merged; independent steward review per feature before merge.
**Branch:** `gps-features` (cut fresh from up-to-date `main`). One commit + one review-packet section
**per feature**. Suggested order: Referral (cleanest) → Notifications → Banner (heaviest).

**Standing locks (all three):** honesty (D-29, no fabricated data) · **DR-043** (earnings language =
"₹X recorded" / "recorded"; NEVER "ready to withdraw" / "available now" unless `payoutsOpen`) · money
is STATIC (`safeMoney`/`DataValue`, never `CountUp` on ₹) · **D-01** (payouts OFF gates real money
movement; test env may toggle `AFFILIATE_PAYOUTS_ENABLED`) · DR-038 PII masking · WCAG AA ·
device-tiered perf (budget-Android <2s) · vibrant card system tokens (no raw colours; `npm run
lint:tokens` stays green). If any point below needs a real product decision not covered here — STOP
and list it, do not guess.

---

## 1 · Notifications (bell → real panel)

**Events (all 5).** Fire server-side at the source-of-truth transition — never recomputed in the UI:

| Type | Fires when | Copy rule |
|---|---|---|
| `COMMISSION_CREDITED` | commission ledger credit (inside the signed Razorpay webhook handler) | DR-043: "₹X commission **recorded**" — never "available to withdraw" |
| `KYC_STATUS` | admin KYC decision (approve/reject) transition | state the new status only; no PII in body (DR-038) |
| `WITHDRAWAL_PAID` | a withdrawal row transitions to `PAID` (already D-01-gated) | "Withdrawal of ₹X marked paid" — factual, past-tense |
| `CERTIFICATE_ISSUED` | certificate issued | safe (non-money) |
| `MILESTONE` | gamification milestone reached | safe (non-money) |

**Schema (new model, mirror existing conventions):**
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  linkUrl   String?  // INTERNAL deep-link only (e.g. /dashboard/earn/commissions) — validated
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt])
  @@index([userId, createdAt])
}
enum NotificationType { COMMISSION_CREDITED KYC_STATUS WITHDRAWAL_PAID CERTIFICATE_ISSUED MILESTONE }
```
**UI.** Wire the existing decorative bell (`components/nav/app-shell.tsx:306`) to a panel: unread
count badge, list (newest first), mark-read / mark-all-read, click → `linkUrl`. Money in any body =
static text. Honest-zero empty state ("You're all caught up"). Reduced-motion-gated entrance only.
**Tier-A because:** the credit/KYC/withdrawal event hooks sit on money/KYC code paths. Keep those
hooks side-effect-only (a failed notification insert must NEVER block or reverse the money/KYC
transaction — wrap in try/catch, log, continue).

---

## 2 · Admin Promo Banner (learner Home slot)

**Founder decisions:** image/GIF/video · scheduled **queue** (multiple, rotating) · admin **upload**
with storage + validation · **active-date-range**.
**Steward amendment (video safety):** IMAGE/GIF = real upload to Supabase Storage (reuse the
`lib/storage/kyc-docs.ts` pattern: server-side type + byte-size + dimension validation, private-ish
bucket + signed/public read as appropriate). **VIDEO = hosted Cloudflare Stream ID/URL, NOT a raw
video upload**, rendered **click-to-play with a required poster image, never autoplay**; on a
low-tier device render the poster only. Rationale: raw video upload + autoplay on the learner Home
breaks the <2s budget-Android budget and is an abuse vector.

**Schema:**
```prisma
model PromoBanner {
  id        String          @id @default(cuid())
  mediaType BannerMediaType
  mediaKey  String?         // Supabase Storage key — IMAGE/GIF
  streamId  String?         // Cloudflare Stream id/url — VIDEO (hosted)
  posterKey String?         // required when mediaType == VIDEO
  headline  String?
  linkUrl   String?         // internal path OR allowlisted external — validated (see below)
  startAt   DateTime?
  endAt     DateTime?
  active    Boolean         @default(true)
  order     Int             @default(0)  // rotation order within the active window
  createdBy String
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  @@index([active, startAt, endAt])
}
enum BannerMediaType { IMAGE GIF VIDEO }
```
**Render.** Home shows banners where `active && now ∈ [startAt, endAt]` ordered by `order`, rotating
client-side (respect reduced-motion → no auto-rotate, show first + manual dots). Perf: lazy-load
media, size-capped at upload, device-tier flattens.
**Security (Tier-A).** `linkUrl` is an open-redirect / phishing vector — validate with the existing
safe-URL guard (`lib/auth/post-auth.ts` safeNext pattern): allow internal paths + an explicit
external allowlist only; reject everything else. Admin CRUD lives in `/admin` (RBAC-gated, log to
`AdminAction`). Blast radius = every learner's Home, so this whole slice is Tier-A.

---

## 3 · Referral Tracking (click → conversion)

**Founder-approved model (steward-recommended, adopted):** unique click = **cookie visitor-ID + 24h
dedup window** (no IP/UA storage — privacy-friendly). **Conversion = PAID enrollment** (not signup),
linked to the existing purchase event. Rationale (DR-043): commission is earned on purchase, so a
signup-based conversion would overstate referral value. Signup attribution is ALREADY live (DR-030
first-touch ref-cookie, `ref-cookie.test.ts`) — this feature adds only (a) pre-signup click logging
and (b) a paid-conversion metric on top.

**Schema (new; extends existing `Referral`/`Affiliate`):**
```prisma
model ReferralClick {
  id        String   @id @default(cuid())
  code      String   // referral code that was hit
  visitorId String   // random UUID from a first-party cookie — NO PII, NO IP, NO UA
  createdAt DateTime @default(now())
  @@index([code, createdAt])
  @@index([visitorId, code, createdAt])  // supports the 24h dedup lookup
}
```
**Click logging.** On a `?ref=CODE` hit (piggyback the existing first-touch capture in
`middleware.ts`/`lib/auth/ref-cookie.ts`): mint/read a first-party `visitorId` cookie (random UUID);
log a `ReferralClick` ONLY if no row exists for `(code, visitorId)` within the last 24h. No PII, no
IP. Respect the existing cookie/consent posture.
**Conversion metric (read-only — NO new money path).** conversion = a referred user (signup already
attributed via `Referral`) who has a **PAID** `Order`. Compute by joining `Referral → Order(status
= PAID)` over the window. Surface on the referral section (near `components/affiliate/share-block.tsx`):
**Clicks · Signups · Paid conversions · Conversion rate.** Money figures via `safeMoney`/`DataValue`,
DR-043. **Tier-A because** it reads/join the referral↔order (money) attribution — even though it
moves no money, get the join + the "paid" definition reviewed.

---

## 4 · Governance (per feature)

Dev branch `gps-features` only — never `main`/production. Commit per feature. Each feature = its own
section in `docs/review-packets/feature-batch.md` (schema diff, before/after, honesty checks,
security notes, Tier-A flag). Every migration + money/KYC/attribution touch = **NEEDS TIER-A REVIEW**,
never self-approved. Keep `typecheck` + `eslint` + full test suite + `build` + `lint:tokens` green
after each. Add tests (event fires, dedup window, paid-vs-signup conversion, linkUrl rejection). PARK
— no deploy. Recommended builder: **Opus** (schema + money + security surface).
