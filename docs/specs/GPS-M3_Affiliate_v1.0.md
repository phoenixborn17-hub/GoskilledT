# GPS-M3 — Affiliate Module Spec v1.0

> **Genesis Stage 04 · DR-027 Module Spec (template v1.1).** Page contracts for the affiliate experience (gold surface). Freezes at founder approval; implementation executes, never invents.
> **DR-029 baked in:** D-01 gates ACTIVATION (flag + copy sets), never the build. Zero blocker statuses in this spec — every pending value is a LAUNCH_CONFIG row.

**Status:** ❄️ **FROZEN v1.0** — founder-approved 2026-07-03 · **Owner:** Phoenix · **Steward:** Claude
**Module:** `affiliate` (+ `ledger`/`wallet` reads, `kyc` build) · **Phase:** 3 (DR-026) · **Tier:** A throughout (money surfaces)
**Sources:** GPS Master v1.1 §5.4 · Blueprint v1.1 §2/§7 · DR-001/007/025/026/029 · D-01/D-29 · LAUNCH_CONFIG #1/#15/#17/#18/#28 · M1 money spine (38/38) + M2 close-out.
**Repo mirror:** canonical = this file; identical mirror at `goskilled-vnext/docs/specs/GPS-M3_Affiliate_v1.0.md` authoritative for implementation.

---

## 1. Scope

**IN:** Earn tab (`/dashboard/earn`, flag-aware) · Referrals (`/referrals`: 3-level tree + share) · Wallet (`/wallet`: held vs available + withdrawal flow) · Commissions (`/commissions`: per-referral ledger view) · KYC (`/kyc`: PAN/bank capture, encrypted) · pre/post-D-01 copy-set slots · `AFFILIATE_PAYOUTS_ENABLED` gating states.
**OUT:** admin-side KYC/withdrawal review + payout execution (GPS-M4) · payout automation (last, post-D-01 + volume; Blueprint §19) · rewards/leaderboard (later slice) · public `/earn` page (M1 COMPLETE) · any commission-model change (DR-007 values are config, LC #15).

**Module-wide invariants:**
- **Money truth = ledger only.** Held/available balances DERIVED from `LedgerEntry` (holdUntil) — never a mutable column, never computed in UI.
- **DR-025 lifecycle everywhere:** credit HELD → 48h → AVAILABLE, or CANCELLED via clawback; held commissions **visible but not withdrawable**; post-window refunds net against future earnings.
- **Flag gating (LC #18):** `AFFILIATE_PAYOUTS_ENABLED=false` → all surfaces render the pre-D-01 state (LC #17 copy set): invite + truthful invite counts, **zero ₹ figures, zero earnings language**. `true` → full money UI. Both states fully built + tested; flip = founder action, logged.
- **D-29 floor (not configurable):** no income projections, examples, calculators, or "potential earnings" — a user sees only their OWN real, ledger-backed numbers, and only post-flag.
- **PII:** PAN/bank AES-256-GCM encrypted at rest (key = LC #28); masked in UI (last-4); never in logs/analytics/AI corpus.
- **Adapters thin:** all rules via `modules/affiliate|wallet|ledger` (M1 spine — DONE, 38/38); no rule re-implemented in routes/actions.
- Theme: gold-forward `[data-theme="affiliate"]`; **gold never text on light** (charcoal text on gold fills). Loading contract (empty/skeleton/error/retry) on every screen. 320px-first, WCAG AA, reduced-motion.

---

## 1A. Affiliate Journey (module-level)

```
Student (any customer) → sees Earn tab → shares referral link (WhatsApp-first)
→ friend buys via link → L1/L2/L3 commission credited HELD (webhook, M1 spine)
→ 48h window passes → AVAILABLE  [refund ⇒ CANCELLED via clawback — never available]
→ [post-D-01 flag ON] completes KYC → requests withdrawal (single pending)
→ founder pays (Tuesday, DR-001; manual rail until automation earns itself) → PAID in ledger
```
Pre-flag: journey stops at "shares link + sees truthful invite counts" (LC #17 copy). Referral linkage is captured NOW so early inviters lose nothing when the programme opens.

## 1B. State Machines

**Affiliate account:** `NO LINK YET → LINKED (code active, pre-D-01 copy) → MONEY-VISIBLE (flag ON) → KYC VERIFIED → WITHDRAWAL PENDING → PAID (cycle)`

**Commission (per referral leg, DR-025):**

| State | Wallet UI | Withdrawable | Analytics |
|---|---|---|---|
| HELD | Visible, "clears in Xh" countdown | ❌ | commission-held* |
| AVAILABLE | Available balance | ✅ (post-KYC) | commission-available* |
| CANCELLED (clawback) | Removed from held; honest line in history | ❌ never | commission-cancelled* |

**Withdrawal:** `APPLIED → (admin review, GPS-M4) → PAID / REJECTED(reason)`; single-pending enforced (partial unique index + `validateWithdrawal`).

*Names finalized against the canonical event set at build (`referral_share` already canonical).

## 1C. Permissions Matrix

| Actor | Access |
|---|---|
| Guest | Public `/earn` waitlist only (M1); zero programme mechanics |
| Student (flag OFF) | Earn tab: invite link + own truthful invite counts; NO ₹ anywhere |
| Student (flag ON) | Own tree (names masked below L1 per privacy), own wallet/commissions, KYC, withdrawal |
| Admin | GPS-M4 surfaces (review/payouts); no impersonation in learner UI |
| Server only | Commission credit/clawback (webhook-only), balance computation, payout marking, PII decrypt |

## 1D. Analytics + Notification-trigger Matrix *(notifications = future context, reference only)*

| Trigger | Analytics | Future notification (Slice 1.5+) |
|---|---|---|
| Link shared | `referral_share` (canonical) | — |
| Referred signup/purchase | referred-purchase* | "Your friend joined" (flag-aware copy) |
| Commission HELD→AVAILABLE | commission-available* | "₹X now available" (post-flag only) |
| Withdrawal APPLIED / PAID / REJECTED | withdrawal-events* | Status updates |
| KYC VERIFIED / REJECTED | kyc-events* | Status update |

## 1E. AI hooks (TODO markers only)

Guru slot: wallet "explain my balance" (ledger-backed, D-29-safe) — commented placeholder only, GPS-M5.

---

## 2. Page Contracts

### 2.0 Earn tab — `/dashboard/earn` *(replaces the current placeholder)*
- **Purpose:** the gold home — flag-aware: pre-D-01 = honest invite hub; post-flag = earnings summary.
- **Primary CTA:** share referral link (one-tap WhatsApp). Post-flag secondary: → wallet.
- **Sections:** FLAG OFF — LC #17 copy ("Invite friends who want to learn"; "programme launching after review — invited friends stay linked to you"), referral link + copy/share, truthful invite count (zero-state: "0 invites yet"). FLAG ON — earnings summary (held/available from ledger), tree teaser → referrals, wallet card → wallet.
- **Animations:** none load-bearing; count-up on real numbers only, reduced-motion static.
- **Components:** gold-theme Card, share button (Web Share API + `wa.me` fallback), WalletSummary (new).
- **Content source:** LC #17 copy slots · `Referral`/ledger reads.
- **Dependencies:** referral code generation (exists), flag (LC #18). **A11y/SEO:** noindex; share button labelled.
- **Status:** IN DEVELOPMENT (placeholder standing → rebuild to contract).

### 2.1 Referrals — `/dashboard/earn/referrals`
- **Purpose:** transparent 3-level network view — trust through visibility (nothing hidden, nothing inflated).
- **Primary CTA:** share link.
- **Sections:** referral link block → L1/L2/L3 tree (real counts; L1 shows names, L2/L3 aggregate counts only — privacy) → per-referral status (REGISTERED/ACTIVATED; ₹ columns only post-flag) → empty state: "No invites yet — share your link".
- **Components:** ReferralTree (new), Badge, share block (shared with 2.0).
- **Content source:** `Referral` table (real data only). **Dependencies:** referral capture at checkout (exists).
- **A11y:** tree as accessible list/table, not visual-only. **SEO:** noindex.
- **Status:** NOT STARTED.

### 2.2 Wallet — `/dashboard/earn/wallet`
- **Purpose:** the trust-critical money screen — exactly what's held, available, and why.
- **Primary CTA:** Withdraw (enabled only: flag ON + KYC VERIFIED + available > 0 + no pending withdrawal).
- **Sections:** Available balance → Held balance with per-credit "clears at" countdown (DR-025 UX rule) → withdrawal form (`validateWithdrawal`; single-pending; Tuesday payout note, DR-001) → history (credits, clawbacks honest-labelled, withdrawals) → lifecycle explainer (48h hold in plain Hinglish-friendly language). FLAG OFF: page exists, shows LC #17 state (no ₹).
- **Components:** WalletSummary, HeldCreditRow (countdown), WithdrawForm, history list.
- **Content source:** `walletSummary()` over ledger (DONE) — UI never computes money.
- **Dependencies:** flag, KYC status, `Withdrawal` single-pending index (exists).
- **A11y:** balances as text; countdowns not color-only. **SEO:** noindex. **Analytics:** withdrawal events*.
- **Status:** NOT STARTED. **Tier A — Fable review mandatory.**

### 2.3 Commissions — `/dashboard/earn/commissions`
- **Purpose:** line-item transparency — every ₹ traceable to a referral and a ledger entry.
- **Primary CTA:** none (ledger view); link → wallet.
- **Sections:** filterable list: date · level (L1/L2/L3) · package · amount · state (HELD countdown / AVAILABLE / CANCELLED with honest refund note) → totals row (= wallet, same source). FLAG OFF: LC #17 state.
- **Components:** data table (extract shared admin-grade table — GPS Master §9 planned item).
- **Content source:** ledger entries + `Referral` joins. **A11y:** real table semantics. **SEO:** noindex.
- **Status:** NOT STARTED.

### 2.4 KYC — `/dashboard/earn/kyc`
- **Purpose:** verify identity before money leaves — compliant, minimal, safe.
- **Primary CTA:** submit for review.
- **Sections:** PAN + bank account + IFSC + account-holder name (Zod-validated, ≤5 inputs) → status states: NOT SUBMITTED / UNDER REVIEW / VERIFIED / REJECTED (reason + resubmit) → what-we-store-and-why note (trust). Review = manual admin (GPS-M4); no external KYC provider (none decided — do not invent).
- **Components:** KycForm, status Badge, masked-value display (last-4 only).
- **Content source:** user input → `Kyc` model, **AES-256-GCM encrypted (LC #28 key), never logged**.
- **Dependencies:** encryption lib (ships with this module), admin review queue (GPS-M4 consumes).
- **A11y:** input formats explained, errors linked. **SEO:** noindex.
- **Status:** NOT STARTED. **Tier A — PII path.**

### 2.5 Withdrawal flow *(inside wallet — contract for the action itself)*
- **Rules (all exist in `modules/wallet` — adapter only):** amount ≤ available · single pending · KYC VERIFIED · flag ON · idempotent request (`payoutIdempotencyKey`) · every request/decision audit-logged · payout marking = admin (GPS-M4), money movement manual (founder, Tuesday DR-001) until automation is earned (Blueprint §19).
- **Failure paths:** validation errors inline; pending-exists → show status instead of form.
- **Status:** NOT STARTED. **Tier A.**

---

## 3. Close-out contract

| Gate | Requirement |
|---|---|
| Quality | typecheck/lint/tests green · **both flag states integration-tested on every surface** · held-vs-available math tested against ledger fixtures (incl. clawback + post-window adjustment) · Lighthouse A11y 100 · 320px + reduced-motion |
| Security | zero ₹/earnings language when flag OFF (D-29 sweep both states) · PII encrypted, masked, unlogged · withdrawal rules server-enforced · no balance computation outside ledger module |
| Content | LC #17 copy slots wired (placeholder = current compliant copy) · no fabricated numbers anywhere (zero-states truthful) |
| Report | MODULE STATUS · LAUNCH_CONFIG rows added/updated in same tickets · NEXT MODULE recommendation |

## 3A. Module component + API index *(module-new only; canonical = GPS Master §9/§12)*

- **Components:** WalletSummary · ReferralTree · HeldCreditRow · WithdrawForm · KycForm · shared data table (first extraction) · share block.
- **Data access:** referral-tree query (3-level, privacy-masked) · wallet/commission list adapters over `walletSummary` · `submitKyc` / `requestWithdrawal` server actions (Zod, audited) · encryption helpers (`lib/pii`).

## 3B. Future extensions (reference only)

Rewards/leaderboard · payout automation (post-D-01 + volume, human gate stays) · shareable public profile/credential · notification nudges. None justify M3 scope creep.

## 3C. Definition of Done

- [ ] Every §2 page exists in BOTH flag states with full loading contract
- [ ] §1B commission/withdrawal states render correctly from ledger fixtures
- [ ] §1C permissions integration-tested (incl. server-only money paths)
- [ ] D-29 sweep passes in both flag states · PII audit (encrypted/masked/unlogged)
- [ ] Mobile 320px + reduced-motion · Lighthouse A11y 100 · tests green
- [ ] LAUNCH_CONFIG rows current (#17 copy, #18 flag, #28 key; add new rows in-ticket)
- [ ] Founder review ✅ · **Fable Tier-A review (wallet/KYC/withdrawal — mandatory)** ✅
- [ ] Merged `--no-ff` · close-out report · GPS Master §5/§9/§12/§19 synced

## 4. Coverage summary

6 contracts: 1 IN DEVELOPMENT (earn placeholder → rebuild) · 5 NOT STARTED. Domain spine already DONE + tested (M1). **Zero blockers (DR-029):** D-01 = LC #1 (activation), flag = LC #18, copy = LC #17, PII key = LC #28. No new decisions — commission values LC #15 (DR-007), payout day DR-001, lifecycle DR-025.

## 5. Founder freeze

- [x] **Approved & FROZEN** — Phoenix · date: 2026-07-03
Mirror to `docs/specs/` on kickoff · implementation may build M3. Changes after freeze = v1.1 via changelog.
