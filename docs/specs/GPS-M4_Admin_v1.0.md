# GPS-M4 — Admin Module Spec v1.0

> **Genesis Stage 04 · DR-027 Module Spec (template v1.1).** The operations cockpit: run the platform, review money/PII, manage content — every mutation audited, every state truthful.
> **DR-029 native:** zero blocker statuses; pending values = LAUNCH_CONFIG rows. **Consolidates carried debt:** M3 Fable nits, LC #30/#31/#32, OTP rate-limit condition (pre-#21).

**Status:** ❄️ **FROZEN v1.0** — founder-approved 2026-07-04 · **Owner:** Phoenix · **Steward:** Claude
**Module:** `admin` (+ `kyc`/`wallet`/`ledger`/`catalog`/`crm` writes via domain) · **Phase:** 4 (DR-026) · **Tier:** A for all money/PII/flag surfaces; B for content CRUD/UI
**Sources:** GPS Master v1.1 §5.5 · Blueprint v1.1 §2 · DR-001/016/024/025/029/030 · LC #18/#27/#30/#31/#32 + OTP rate-limit condition · M3 close-out + Fable review notes · existing admin build (shell/RBAC/users/payments/leads/review-queue).
**Repo mirror:** canonical = this file; identical mirror at `goskilled-vnext/docs/specs/GPS-M4_Admin_v1.0.md`.

---

## 1. Scope

**IN:** Admin dashboard (KPIs from real data) · Settings (incl. `AFFILIATE_PAYOUTS_ENABLED` flip UI) · **KYC review queue** (LC #30) · **Withdrawals review + payout marking** (Tuesday, DR-001) · Catalog CRUD (courses/modules/lessons + video asset IDs — how real content enters without reseeding) · Webinar admin (schedule sessions → unblocks LC #27 + Event JSON-LD) · Audit-log view · contract-verify of the 4 standing pages (users/payments/leads/review-queue) · **Carried tickets:** M3 nits (withdrawal+audit `$transaction`; `bankNameEnc` = "Account holder name" label), LC #32 schema cleanup (`accountHolderEnc` migration), OTP-send rate limiting (register/login/checkout — pre-LC #21).
**OUT:** popups/rewards (later slice) · analytics dashboards/Command Center (P2) · user impersonation (never without a DR) · granular admin roles beyond the single `admin` claim (future DR if team grows) · refund EXECUTION UI beyond marking (Razorpay-side action stays manual pre-launch).

**Module-wide invariants:**
- **Every admin mutation = one `$transaction` containing the domain write + its `AdminAction` audit row.** (Fable nit — now law for this module.)
- **Admin never types money numbers into the ledger.** Payout marking calls the existing ledger/wallet domain (zero-sum `PAYOUT` legs, `payoutIdempotencyKey`); balances stay derived.
- **PII in review UI:** decrypt server-side only, display masked by default with explicit "reveal" (logged as `KYC_VIEWED`); nothing PII in URLs, logs, or analytics. `bankNameEnc` renders as **"Account holder name"** until LC #32 migration lands.
- **Flag flips are ceremonies:** `AFFILIATE_PAYOUTS_ENABLED` UI shows current state + D-01 gate note; flipping requires typed confirmation ("ENABLE PAYOUTS"), writes audit row, and is env-guarded (UI cannot flip if LC #1 not FINAL — reads LAUNCH_CONFIG discipline into runtime config).
- **Truthful zero-states** everywhere (0 users = "0 users", never sample data — D-29 floor applies to admin too). Charcoal theme; desktop-first is acceptable for admin ONLY (mobile must remain usable, 320px functional not optimized).
- RBAC = Supabase role claim (DR-024), middleware + server re-check (existing) — no new auth surface.
- Loading contract (empty/skeleton/error/retry) on every screen; canonical analytics only (admin actions are AUDIT events, not analytics).

---

## 1A. Operator Journey (module-level)

```
Admin logs in (role claim) → Dashboard (today: signups, orders, revenue, pending KYC/withdrawals, leads)
→ works queues: KYC review (approve/reject+reason) → Withdrawals (Tuesday: verify → pay manually
   via bank → mark PAID = ledger PAYOUT tx) → Leads/Review-queue (existing)
→ manages content: catalog CRUD (lesson video IDs when recordings land) · webinar schedule
→ Settings: flags + config visibility  → every action lands in the Audit log
```

## 1B. State Machines (admin-owned transitions)

**KYC review:** `SUBMITTED → APPROVED / REJECTED(reason, resubmit allowed)` — one reviewer action, audited, learner sees status + reason.
**Withdrawal:** `APPLIED → PAID(paidAt + ledger PAYOUT tx, idempotent) / REJECTED(reason → funds remain AVAILABLE)` — Tuesday cadence (DR-001) is operational discipline, not code-enforced.
**Payout flag:** `OFF → ON` (typed confirm + audit + LC #1 FINAL precondition) · `ON → OFF` (emergency, same ceremony).
**Course:** `COMING_SOON → PUBLISHED` (requires ≥1 module + ≥1 lesson with video asset; DR-011 catalog only — new courses need a DR).

## 1C. Permissions Matrix

| Actor | Access |
|---|---|
| Admin (role claim) | Everything below; every mutation audited |
| Learner/Affiliate | Zero admin surface access (middleware + server re-check) |
| Server only | PII decrypt, ledger PAYOUT execution, flag runtime read |
| Nobody | Impersonation · direct ledger edits · deleting audit rows (append-only) |

## 1D. Audit-event Matrix *(AdminAction rows — not analytics)*

| Action | Audit event | Notes |
|---|---|---|
| KYC approve/reject | `KYC_APPROVED` / `KYC_REJECTED` (reason) | + `KYC_VIEWED` on PII reveal |
| Withdrawal paid/rejected | `WITHDRAWAL_PAID` (ledger tx id) / `WITHDRAWAL_REJECTED` (reason) | idempotent |
| Flag flip | `PAYOUTS_ENABLED` / `PAYOUTS_DISABLED` | typed-confirm recorded |
| Catalog write | `COURSE_UPDATED` / `LESSON_UPDATED` (diff summary) | video asset ID changes logged |
| Webinar schedule | `WEBINAR_SCHEDULED` | feeds public page + Event JSON-LD |

## 1E. AI hooks (TODO only)

Jarvis (Blueprint §25, DR-016: admin panel = "Jarvis") entry slots: dashboard "ask about today" + audit-log natural-language search — commented placeholders, GPS-M5+/Command Center.

---

## 2. Page Contracts

### 2.0 Admin dashboard — `/admin` *(replaces the current landing)*
- **Purpose:** one glance = state of the business today; queues surfaced by urgency.
- **Primary CTA:** deep-links into pending queues (KYC n · Withdrawals n · Leads n).
- **Sections:** today/7d KPI strip (signups, orders, revenue paise→₹ display, active learners — all real queries) → pending-work cards → recent audit trail (last 10).
- **Components:** stat cards, queue cards, shared data table. **Data:** real aggregates only; zero-states truthful.
- **A11y/SEO:** noindex; table semantics. **Status:** NOT STARTED (current page = placeholder landing).

### 2.1 Users / Payments / Leads / Review-queue *(standing — contract-verify)*
- **Purpose:** existing Slice-1 surfaces; M4 verifies against loading-contract + audit invariants and adds shared-table sort/filter/pagination where missing.
- **Status:** IN DEVELOPMENT (built; close-out verifies + polish only, no redesign).

### 2.2 KYC review — `/admin/kyc` *(LC #30 — Tier A, PII)*
- **Purpose:** the human gate before money leaves — careful, logged, minimal exposure.
- **Primary CTA:** Approve / Reject (reason required).
- **Sections:** queue (SUBMITTED, oldest first) → detail: masked PAN/account + **"Account holder name"** (bankNameEnc) + IFSC → explicit reveal (logged) → decision + reason → history of past decisions per user.
- **Dependencies:** M3 `Kyc` rows; decrypt server-side (`lib/pii`). **Failure paths:** decrypt error → safe error, never partial PII.
- **Status:** NOT STARTED. **Tier A.**

### 2.3 Withdrawals — `/admin/withdrawals` *(Tier A, money)*
- **Purpose:** Tuesday payout run — verify, pay (manual bank rail), mark truthfully.
- **Primary CTA:** Mark PAID (after real transfer) / Reject (reason).
- **Sections:** APPLIED queue (amount, KYC status badge, account last-4, holder name) → per-row: verify checklist (KYC APPROVED ✓ · amount ≤ available ✓ — server-recomputed at marking time, not trust-the-row) → Mark PAID ⇒ **one `$transaction`:** ledger `PAYOUT` legs (idempotency `payoutIdempotencyKey`) + `Withdrawal.status=PAID, paidAt` + audit → history tab.
- **Failure paths:** double-mark attempt → idempotent no-op with notice; balance changed since APPLIED → hard stop + re-review.
- **Status:** NOT STARTED. **Tier A — the most sensitive surface in M4.**

### 2.4 Settings — `/admin/settings`
- **Purpose:** runtime configuration visibility + the payout ceremony.
- **Sections:** read-only config panel (providers active, env-validated status, LAUNCH_CONFIG pending count — honesty dashboard) → **`AFFILIATE_PAYOUTS_ENABLED` flip** (state, D-01 note, typed confirm, audit; disabled until LC #1 FINAL) → OTP rate-limit status (post carried-ticket).
- **Status:** NOT STARTED. **Tier A (flag).**

### 2.5 Catalog CRUD — `/admin/catalog`
- **Purpose:** real content enters the product here — courses → modules → lessons → video asset IDs (Stream UID or preview URL), durations, order; free-preview flag; publish gate (§1B).
- **Primary CTA:** per-entity save (Zod; slugs immutable after publish).
- **Guardrails:** DR-011 7-course catalog only (adding an 8th = blocked with "needs a DR") · `[PLACEHOLDER]` labels visible until real titles land · system course (getting-started) hidden but editable (Lesson 0 video slot, LC #10).
- **Status:** NOT STARTED. **Tier B** (escalates to A only if entitlement/pricing touched — it must NOT be; packages stay seed/DR-controlled).

### 2.6 Webinar admin — `/admin/webinar`
- **Purpose:** schedule the two-session model (Sun intro / Fri training) — clears LC #27 mechanics.
- **Sections:** upcoming sessions CRUD (datetime IST, topic, link) → registrations list (from crm) → publishes to `/webinar` + Event JSON-LD automatically.
- **Status:** NOT STARTED. **Tier B.**

### 2.7 Audit log — `/admin/audit`
- **Purpose:** append-only trail of every admin/money mutation; the accountability surface.
- **Sections:** filterable table (actor, action, entity, date) → row detail (meta JSON, no PII) → export CSV.
- **Status:** NOT STARTED. **Tier B** (read-only).

### 2.8 Carried tickets (in-module, not pages)
1. **OTP-send rate limiting** — per-IP + per-phone via `lib/rate-limit` on register/login/checkout send actions; LAUNCH_CONFIG row tied to #21. **Tier A.**
2. **M3 nit retrofit** — wrap M3's `requestWithdrawal` + audit in one `$transaction` (same invariant as §1). **Tier A.**
3. **LC #32** — `accountHolderEnc` column migration + data move + `bankNameEnc` retire. **Tier A (schema).**

---

## 3. Close-out contract

| Gate | Requirement |
|---|---|
| Quality | typecheck/lint/tests green · payout-marking idempotency + balance-recheck integration-tested against ledger fixtures · KYC decrypt/reveal path tested (no PII leak in errors/logs) · flag ceremony tested (both directions + precondition) · Lighthouse A11y on admin surfaces (structural if auth-blocked) |
| Security | every mutation in `$transaction` with audit row · PII masked-by-default + reveal logged · no ledger math outside domain · RBAC re-checks on every action |
| Content | zero sample/demo data anywhere (D-29 admin floor) |
| Report | MODULE STATUS · LAUNCH_CONFIG rows updated in-ticket (#27 #30 #31 #32 + rate-limit row) · NEXT MODULE recommendation |

## 3A. Module component + API index *(module-new only; canonical = GPS Master §9/§12)*
- **Components:** shared admin data table (extraction) · StatCard · QueueCard · MaskedPiiField (reveal-logged) · TypedConfirm dialog · session CRUD form.
- **Actions:** `reviewKyc` · `markWithdrawalPaid` / `rejectWithdrawal` · `setPayoutsFlag` · catalog CRUD actions · `scheduleWebinar` — all Zod + `$transaction` + audit.

## 3B. Future extensions (reference only)
Granular admin roles (needs DR) · refunds console · popups/rewards · Jarvis conversational admin (Blueprint §25 Phase 3) · analytics dashboards (Command Center Phase 1). No M4 scope creep.

## 3C. Definition of Done
- [ ] Every §2 page exists (or documented-BLOCKED) with loading contract; standing pages contract-verified
- [ ] §1B transitions render + integration-tested (KYC, withdrawal incl. idempotent re-mark, flag, publish gate)
- [ ] §1D audit rows asserted in tests for every mutation
- [ ] Carried tickets 1–3 landed (rate-limit · $tx retrofit · LC #32 migration)
- [ ] PII audit passes (masked default, reveal logged, zero PII in logs/errors)
- [ ] Tests green · typecheck/lint/format · 320px functional
- [ ] LAUNCH_CONFIG rows current · Founder review ✅ · **Fable Tier-A review (KYC/withdrawals/settings/schema — mandatory)** ✅
- [ ] Merged `--no-ff` · close-out report · GPS Master §5/§9/§12/§19 synced

## 4. Coverage summary

8 contract areas: 4 standing (verify+polish) · 7 NOT STARTED builds (dashboard, KYC review, withdrawals, settings, catalog CRUD, webinar admin, audit log) · 3 carried Tier-A tickets. Zero blockers; Layer-2 rows: LC #1 (flag precondition), #10 (Lesson-0 video via catalog CRUD), #21 (rate-limit tie), #27 (webinar schedule = founder enters real dates post-build), #30–32 (resolved by this module).

## 5. Founder freeze

- [x] **Approved & FROZEN** — Phoenix · date: 2026-07-04
Mirror to `docs/specs/` on kickoff · implementation may build M4 (fresh branch off main, rule 6). Changes after freeze = v1.1 via changelog.
