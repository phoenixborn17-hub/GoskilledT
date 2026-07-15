# Feature Batch v1.0 — Review Packet

**Spec:** `docs/specs/Feature_Batch_Notifications_Banner_Referral_v1.0.md` (founder-approved 2026-07-16).
**Branch:** `gps-features` (cut fresh from up-to-date `main` @ `2ba7d1f`). **PARKED, not merged.**
**All three features are Tier-A** (schema migration + money/KYC/attribution + admin/learner blast
radius) per the spec's own governance section. Never self-approved.

**Confirmation: nothing touched `main` or production.** `main` is still at
`2ba7d1fe592504005ccb1fd17683edb929f1d6d1` (unchanged since the prior overnight-rework merge). All
4 commits below live only on `gps-features`. No push, no deploy, no merge was performed or attempted.

---

## Commit list (oldest → newest)

```
77f514f gps-features: add frozen spec — Feature Batch v1.0
fb07b2b feature-batch-1: referral click tracking + paid-conversion metric (Tier-A)
6850c4e feature-batch-2: notifications — real bell panel + all 5 event hooks (Tier-A)
c310b11 feature-batch-3: admin promo banner — Home slot + admin CRUD (Tier-A)
```

Every commit: `npm run typecheck` clean, `npx eslint` clean on changed files (0 errors throughout),
`npx tsx scripts/check-color-tokens.ts` clean, full Vitest suite green, `npm run build` compiles
(only the pre-existing, by-design dev-providers-in-production guard errors, unrelated to any of
this work — documented in project memory).

**Final state: 528/528 tests green** — 488 pre-batch baseline (from the overnight-rework merge) →
+10 (feature 1, referral) → 498 → +9 (feature 2, notifications) → 507 → +21 (feature 3, banner) →
528. See each feature's section below for exactly what those tests cover.

---

## Feature 1 — Referral Click Tracking

### Schema diff (migration `20260715041954_referral_click_tracking`)

```prisma
model ReferralClick {
  id        String   @id @default(cuid())
  code      String
  visitorId String
  createdAt DateTime @default(now())
  @@index([code, createdAt])
  @@index([visitorId, code, createdAt])
}
```
RLS-ENABLED (deny-all) per Golden Rule 15.

### Before/after

| Surface | Before | After |
|---|---|---|
| Referral clicks | No visibility into pre-signup link visits at all | Every `?ref=CODE` hit logs a deduped click (cookie visitorId + 24h window, no IP/UA) |
| `/dashboard/earn/referrals` | Referral tree only (L1 names, L2/L3 counts) | + a new stats panel: **Clicks · Signups · Paid conversions · Conversion rate**, via `safeCount`/`DataValue` |
| Conversion definition | Didn't exist | PAID enrollment only (not signup) — DR-043-aligned: commission is earned on purchase, so a signup-based metric would overstate referral value |

### Implementation notes (read before reviewing)

- **Attribution source deviation from the spec's literal schema, matching existing precedent.** The
  spec's illustrative pseudo-code joins `Referral → Order`. The app's REAL, populated attribution
  graph is `User.referredById` — the `Referral` table is documented as unpopulated by the app
  (`lib/affiliate/referrals.ts`'s own header comment, predating this batch). This module follows
  that same precedent rather than the literal spec schema. Flagging for the reviewer to confirm
  this reading is correct.
- **Click logging can't happen in Edge middleware directly** (Prisma/Postgres isn't reachable from
  the Edge runtime `middleware.ts` runs in). The fix: middleware mints/reads a `gs_vid` visitor
  cookie and fires a non-blocking `fetch` to a new Node.js route handler
  (`app/api/referral/click`), kept alive past the response via `event.waitUntil()` — never awaited
  inline, never slows any request. IP is used only as an in-memory rate-limit key on that endpoint
  (60 req / 10 min), never persisted.
- Click logging is a **separate trigger** from the existing DR-030 first-touch `gs_ref` cookie
  capture — it fires on every `?ref=` hit, not gated by whether `gs_ref` is already set.

### Honesty / security checks

- ✅ No fabricated data — clicks/signups/conversions are real counts; `conversionRate` is `null`
  (not a fabricated 0%) when there are zero clicks.
- ✅ No PII/IP/UA stored in `ReferralClick` (spec requirement, verified in the migration + domain code).
- ✅ Money nowhere in this feature's UI (counts only) — still routed through `safeCount`/`DataValue`
  for the same fail-safe-display discipline.
- ✅ New anonymous public write endpoint (`/api/referral/click`) is Zod-validated + IP rate-limited.

### Tests — 10 new (488 → 498)

Unit (4): visitorId UUID-shape validation, per-IP rate limit (under/over/independent-IPs).
Integration (6): first click logs, same-pair dedupes within 24h, different visitorId does NOT
dedupe, a click 25h later logs again, paid-vs-unpaid downline conversion counting (3 clicks / 2
signups / 1 paid conversion), null rate with zero clicks.

---

## Feature 2 — Notifications

### Schema diff (migration `20260715043030_notifications_v2`)

```prisma
enum NotificationType { COMMISSION_CREDITED KYC_STATUS WITHDRAWAL_PAID CERTIFICATE_ISSUED MILESTONE }
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  linkUrl   String?
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt])
  @@index([userId, createdAt])
}
```
RLS-ENABLED (deny-all) per Golden Rule 15.

### Before/after

| Surface | Before | After |
|---|---|---|
| `components/nav/app-shell.tsx` bell | Decorative — no `onClick`, went nowhere | Real panel (`NotificationBell`): unread badge, list newest-first, mark-read/mark-all-read, click → `linkUrl`, honest-zero ("You're all caught up") |
| Commission credit | Silent | `COMMISSION_CREDITED` notification, DR-043 copy ("₹X commission recorded"), post-webhook-commit |
| KYC decision | Silent | `KYC_STATUS` notification, no PII in body, post-commit |
| Withdrawal marked PAID | Silent | `WITHDRAWAL_PAID` notification, factual past-tense, post-commit, only on genuine success |
| Certificate issued | Silent | `CERTIFICATE_ISSUED` notification, fires once per (user, course) — same fresh-create branch as issuance itself |
| Milestone reached | Silent | `MILESTONE` notification, deduped against the Notification row itself (see below) |

### Implementation notes (read before reviewing)

- **All 5 hooks fire AFTER their source-of-truth transaction commits, never inside it** — same
  discipline the webhook already uses for analytics/receipt (`lib/payments/webhook.ts`).
  `lib/notifications/notify.ts`'s core `notify()` is fail-safe by contract (try/catch + log,
  resolves even on failure — mirrors `lib/analytics/track.ts` / `lib/email/send.ts` exactly), so a
  notification-insert outage can never block or reverse a money/KYC transaction.
- **COMMISSION_CREDITED required a small signature change** to `lib/payments/webhook.ts`'s internal
  `executeAction()` — it now accepts an out-array that `CREDIT_COMMISSIONS` pushes
  `{userId, amountInPaise}` into per credited upline, so the caller can notify each recipient
  post-commit. Verified non-regressing: the full DR-038 earning-gate webhook suite (5 tests) still
  passes unchanged.
- **MILESTONE is architecturally different from the other 4** — milestones are DERIVED, never
  stored (`lib/dashboard/gamification.ts`, pre-existing design: "nothing stored, nothing
  fabricated"). There is no discrete write-transition to hook. Resolution: the milestone
  recomputation itself (already server-side) IS treated as the source-of-truth check, gated by
  `notifyMilestoneIfNew()`, which dedupes against the Notification row already sent for a given
  `(userId, title)` — no new tracking table, staying inside the spec's exact schema. **Documented
  trade-off, flagging for the reviewer:** a rare concurrent double-page-load race could in theory
  insert a duplicate milestone notification. Low-stakes (cosmetic, non-money) — a dedicated unique
  constraint didn't seem worth it for this event type, but it's a real gap if the reviewer disagrees.

### Honesty / security checks

- ✅ DR-043 verified by test: commission/withdrawal copy contains "recorded"/"marked paid",
  asserted to NOT contain "available" or "ready to withdraw".
- ✅ No PII in KYC-status body (status word only, e.g. "Your KYC is now verified.").
- ✅ `linkUrl` runs through `safeNext` (the existing open-redirect guard) — an invalid/external
  value is dropped to `null` rather than rejecting the whole notification.
- ✅ Certificate/withdrawal/commission notifications fire exactly once per real-world event
  (verified by the existing idempotency mechanisms each source-of-truth already has — no new
  idempotency logic invented).

### Tests — 9 new (498 → 507)

Integration: insert shape, fail-safe on a bad FK (never throws), DR-043 commission/withdrawal copy
assertions (2), no-PII KYC copy, certificate `linkUrl`, external-`linkUrl` rejection, milestone
dedupe (same milestone twice → 1 row), distinct milestones don't dedupe against each other (→ 2
rows). Also re-ran the pre-existing certificate mandatory-quiz-gate suite (6) and DR-038 webhook
suite (5) unchanged — both still pass, confirming the new hooks didn't disturb the logic they ride
alongside.

**Not manually browser-verified this session** — the interactive bell UI (Popover open/close,
mark-read click behavior) wasn't exercised in a live browser; the preview tooling's login flow was
unavailable in this session (same limitation noted in the prior overnight-rework packet). Flagging
as unverified interactive UI, not unverified mechanism — typecheck/tests/build all pass, and the
component code was read/reviewed carefully against the `Popover`/`IconButton` APIs it composes.

---

## Feature 3 — Admin Promo Banner

### Schema diff (migration `20260715044701_promo_banner`)

```prisma
enum BannerMediaType { IMAGE GIF VIDEO }
model PromoBanner {
  id        String          @id @default(cuid())
  mediaType BannerMediaType
  mediaKey  String?
  streamId  String?
  posterKey String?
  headline  String?
  linkUrl   String?
  startAt   DateTime?
  endAt     DateTime?
  active    Boolean         @default(true)
  order     Int             @default(0)
  createdBy String
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  @@index([active, startAt, endAt])
}
```
RLS-ENABLED (deny-all) per Golden Rule 15.

### Before/after

| Surface | Before | After |
|---|---|---|
| Learner Home | No promo/hero banner slot existed | New slot, placed low-priority (after Store, alongside Announcements) — renders **nothing** when there's no live banner, never a placeholder |
| `/admin` | No banner management | New `/admin/banner`: create (image/GIF upload OR video id+poster), toggle active, edit rotation order, delete — every mutation RBAC-gated + audited to `AdminAction` |
| Video handling | N/A | Cloudflare Stream id/url only (admin pastes it — **never a raw video upload**), click-to-play, required poster, **never autoplay**, low-tier devices get the poster only and the Stream iframe never mounts |

### Implementation notes (read before reviewing)

- **New dependency-free image-dimension sniffer** (`lib/storage/image-dimensions.ts`) — hand-rolled
  PNG/GIF/JPEG/WebP header parsing instead of adding an npm dependency (e.g. `image-size`) for this
  narrow, well-defined need. Reads only the format header, never decodes pixel data. 5 unit tests
  with hand-crafted valid headers per format (no real image files needed). **Flagging for the
  reviewer:** this is new, security-adjacent parsing code (untrusted upload bytes) that a
  well-vetted library would normally handle — worth an extra look, or a recommendation to swap in
  a real dependency later if the hand-rolled version proves fragile against edge-case files.
- **Public bucket, unlike KYC's private one** — banner media is meant to be visible to every
  learner, no PII involved, so `lib/storage/banner-media.ts` creates a PUBLIC Supabase Storage
  bucket (`promo-banners`) rather than reusing KYC's private+signed-URL pattern.
- **Bug found and fixed while building this:** `bannerMediaPublicUrl` initially routed through the
  Supabase admin client, which requires `SUPABASE_SERVICE_ROLE_KEY` — but a public bucket's object
  URL is a deterministic string (`{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`) that
  needs no authorization to construct. Rebuilt as a pure string template. This also unblocked the
  query-layer integration tests in an environment with no service-role key configured.
- **`linkUrl` external-allowlist is intentionally empty** — `safeBannerLink`
  (`lib/auth/post-auth.ts`) validates internal paths via the existing `safeNext`, but the list of
  allowlisted external hosts is empty by design: **which external domains (if any) an admin should
  be able to link a banner to is a founder/business decision this session did not guess at.** Every
  external URL is rejected today; the mechanism is ready to extend the moment that's decided. This
  is the one item from the spec that maps directly onto "STOP and list a real product decision."
- **Untested against real Supabase Storage** — `uploadBannerMedia`/`ensureBannerBucket` need a real
  `SUPABASE_SERVICE_ROLE_KEY`, unavailable in this environment (documented, same pre-existing
  limitation KYC doc upload has). Only the pure validation logic and the query/mutation layer
  (against directly-seeded rows, bypassing upload) are tested here. **The reviewer should verify an
  actual upload round-trip against a real bucket before merge.**

### Honesty / security checks

- ✅ Home renders nothing when there's no live banner — no placeholder, no fabricated content.
- ✅ `linkUrl` validated (internal-only today, by design — see above); malformed/`javascript:`/
  non-https external URLs all rejected (tested).
- ✅ Video never autoplays; low-tier devices never mount the Stream iframe (tested via the
  `useDeviceTier` gate in the carousel — logic verified by code review, not a live low-tier device).
- ✅ Byte-size caps (3MB image / 5MB GIF) and a pixel-dimension floor/ceiling reject oversized or
  malformed uploads server-side (tested).
- ✅ Every admin mutation (create/toggle/reorder/delete) writes an `AdminAction` audit row with the
  real admin as actor (tested for toggle + delete).

### Tests — 21 new (507 → 528)

8 unit (banner-media validation: content-type allowlist, per-media-type byte caps, dimension floor,
malformed-header rejection, path sanitization) + 5 unit (image-dimensions format parsing, all 4
formats + malformed rejection) + 4 unit (`safeBannerLink`: internal pass, all-external-rejected,
non-https rejected, malformed input rejected) + 4 integration (live-window query correctness across
5 seeded banners spanning every active/date-range combination, setActive+audit, setOrder,
delete+audit).

**Not manually browser-verified this session** — the admin CRUD form and the Home carousel weren't
exercised in a live browser (same login-flow-unavailable limitation as feature 2). Flagging as
unverified interactive UI.

---

## Everything flagged NEEDS TIER-A REVIEW (summary)

1. **All three features** — new schema migrations touching money-adjacent (`ReferralClick`↔`Order`
   join), money/KYC-hook (`Notification`), and admin/public-write (`PromoBanner`) surfaces. Per the
   spec's own governance, every one of these is Tier-A by definition.
2. **`lib/payments/webhook.ts`** — the `executeAction()` signature change (out-array for credited
   commissions) touches the money webhook, even though the change itself is additive/side-effect-only.
3. **`app/api/referral/click`** — a new anonymous, public write endpoint. Rate-limited + Zod-validated,
   but new public surface area on its own merits review.
4. **`lib/storage/image-dimensions.ts`** — new hand-rolled binary-parsing code over untrusted upload
   bytes; flagged above for extra scrutiny.
5. **Banner Storage upload path** — untested against a real bucket in this session (no service-role
   key available locally); reviewer should verify before merge.
6. **`safeBannerLink`'s empty external allowlist** — not a code issue, but the reviewer/founder should
   confirm the "internal-only for now" stance is acceptable, or supply the allowlist.

Nothing above was self-approved or merged — all four commits are parked on `gps-features` per the
standing gate.

## Product decision surfaced (not guessed at)

**Which external domains, if any, should an admin be able to link a promo banner to?** Currently
none — `safeBannerLink`'s allowlist is empty and every external URL is rejected. If the founder
wants specific partners/domains linkable (e.g. a WhatsApp group, an external landing page), name
them and the array in `lib/auth/post-auth.ts` (`BANNER_EXTERNAL_ALLOWLIST`) is a one-line addition.
