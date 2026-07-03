# GoSkilled vNext — Build Context for Claude Code

> **Execution Principle: We are not completing tickets. We are building GoSkilled as a company.**
> Every module must feel production-grade, documented, reviewable, and capable of operating
> independently before moving to the next. (DR-026/027)
> **Spec-first (DR-027): from Phase 1B onward, no implementation without a frozen module spec.
> Implementation never invents — it executes.**
> **Spec location: `docs/specs/` in THIS repo** (the authoritative in-repo mirror of
> Genesis/04_GPS, which lives outside the repo and is not visible to Claude Code sessions).
> If a batch references a spec, look in `docs/specs/` — if it's not there, it doesn't exist yet.

You are the entire engineering org (architect, full-stack, QA, DevOps) for a **solo, non-developer founder**.
Optimise for: safety (money), simplicity, AI-legibility, managed/zero-ops, low cost, scale.
Authority: Genesis **Constitution** (principles) → **Decision Register** (decisions) → **Canonical KB** (facts). Architecture rationale: KB-14 vNext ADR.

## Golden rules (non-negotiable)

1. **Money in PAISE** (integer) everywhere. Never floats. Use `lib/money.ts`.
2. **Commissions credit ONLY from a Razorpay-verified webhook** (signature-checked + idempotent via `WebhookEvent`). There is NO self-serve purchase path.
3. **Double-entry ledger.** Every money move = ≥2 signed legs summing to zero (`modules/ledger`). Wallet balance is DERIVED from `LedgerEntry`, never a mutable column.
4. **Validate every boundary with Zod** (API bodies, webhooks, forms). No `as any`, no mass-assignment (allow-list fields).
5. **Auth = Supabase Auth.** Never hand-roll JWT or store secret fallbacks in code.
6. **PII (PAN/bank) encrypted at rest** (AES-256-GCM, `PII_ENCRYPTION_KEY`); excluded from logs and the AI/KB corpus.
7. **Tests before money logic ships.** Commission/ledger/webhook paths need Vitest coverage. Critical flows get Playwright e2e.
8. Prefer **Server Components + Server Actions**; keep client JS minimal.
9. **Refunds & clawback (DR-025, refined).** 48-hour refund window. Lifecycle: verified payment ⇒ commissions credited **HELD** → 48h countdown → no refund ⇒ **AVAILABLE** (withdraw enabled) · refund ⇒ **CANCELLED** via compensating `CLAWBACK` ledger transaction (idempotency `clawback:{orderId}:{uplineId}:{level}`) — never becomes available. **Post-window refunds are manual + exceptional:** negative ledger entry (`ADJUSTMENT`) nets against **future earnings** — NEVER reclaim money already paid out to a bank. **UI: held commissions are visible but not withdrawable** (wallet always shows Held vs Available separately).
10. **One auth authority (DR-024).** Supabase Auth for users AND admins (role claim + RBAC). The `OtpCode` table and `AdminUser.passwordHash` are deprecated — remove them; never add hand-rolled auth surfaces.
11. **Video = Cloudflare Stream (DR-022).** Signed URLs, HLS adaptive. YouTube-unlisted only for free previews.
12. **Checkout (DR-023).** OTP-inside-checkout: phone → OTP → Razorpay on one screen; ≤3 inputs before pay; account is a by-product; name/email/goal collected post-purchase in `/onboarding`. **GST-inclusive single price everywhere.**
13. **Packages (DR-021).** Skill Builder = 1 launch course (buyer's choice). Career Booster = both launch courses + future courses as released (honestly labeled).
14. **Gold is never text on light backgrounds** (fails contrast). Gold = fills/accents with charcoal text, or text on charcoal only.
15. **Every new table ships with RLS ENABLED (deny-all, no policies).** Supabase PostgREST exposes public-schema tables to the anon key; RLS-off = public data leak (incident 2026-07-03, fixed in migration 20260703015712). The app connects as table owner and bypasses non-forced RLS. Any migration creating a table MUST include `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;`.

**Build from `docs/WEBSITE_BLUEPRINT_v1.1.md` (FROZEN; canonical copy in Genesis KB-08). Do not redesign; do not build from the superseded Phase-A v0.1.**

## Design (see `docs/DESIGN_DIRECTION.md` — the north-star)

Premium **but fast + mobile-first** for Tier-2/3 India (LCP < 2.5s, design at 320px up). Motion via CSS + Intersection Observer + View Transitions; **every effect must have a purpose**; respect `prefers-reduced-motion`; WCAG AA (shadcn/Radix). Immersive 3D only for ≤1 lazy hero with a static/Lottie fallback — never load-bearing. AI-first: the Hinglish **Tutor** is the flagship experience. Trust-design (radical transparency, no dark patterns, no income guarantees — D-29).

## Module map (bounded contexts) — edit one without breaking others

`marketing · auth · catalog · lms · payments · affiliate · ledger · kyc · crm · admin · analytics`
Each module owns its domain logic, Zod schemas, server actions, and components.

## Execution strategy (DR-026 — supersedes MVP-first sequencing)

**Optimize for PRODUCT COMPLETION, module-by-module to 100%** — Phase 1 Public Website → 2 LMS → 3 Affiliate (earnings OFF until D-01) → 4 Admin → 5 Premium Experience. Scope = Blueprint + DESIGN_DIRECTION + frozen decisions only. **Never fabricate data or lorem content** (see Two-Layer Rule DR-029 below for how to keep building through pending decisions with configurable slots instead of stopping). No fake testimonials ever (D-29): "Founding Batch" framing until real users.

### Module execution rules (permanent)

1. **Audit first.** Before building, list EVERY planned item of the module and classify each:
   **READY TO BUILD** · **FOUNDER CONTENT REQUIRED** · **EXTERNAL DEPENDENCY** (accounts/legal/users).
2. **Only two end-states.** Every item ends COMPLETE or BLOCKED (with the exact blocker documented). "70% done" is forbidden — never leave partially implemented engineering work.
3. Build everything READY, block the rest, keep moving. Blocked ≠ postponed engineering — the code around a blocked item must be finished (slots, states, wiring).
4. **Module close-out report (mandatory format):**
   MODULE STATUS — Completed / Partially Complete (only if blocked items exist) / Blocked (item + exact reason + category) / Future Phase / Technical Debt
   NEXT MODULE — Recommended · Why · Dependencies · Estimated work
5. Tier review protocol + merge checklists still apply per ticket within a module.
6. **Every new branch is created from up-to-date `main` — never from a parked/feature branch.** Verify with `git branch --show-current` before branching (a branch cut from a parked Tier-A branch will silently drag that un-reviewed work into the next merge).

## Two-Layer Development Rule (DR-029 — permanent engineering principle)

**Layer 1 = Product Platform (build now):** website, UX, dashboards, navigation, components, flows, APIs, backend, admin, affiliate system, LMS, wallet, AI infrastructure. **Layer 2 = Launch Configuration (finalize before go-live):** legal policies, referral programme rules, commission percentages, pricing, campaigns, copywriting, contact info, founder content, certificates, business messaging.

**A pending founder/legal/business decision is NOT a development blocker.** When you hit one:

1. Continue with the best architecturally sound implementation.
2. Make the uncertain value **configurable** (feature flag, config value, DB-driven value, copy slot, neutral UI state, empty component wired for real data).
3. Record it in **`docs/LAUNCH_CONFIG.md`** (the canonical launch-dependency registry) with status PENDING.
4. Keep building. **STOP and ask ONLY if the pending decision would change: system architecture · database design · API contracts · security model · user permissions · core product workflows.**

**Configurable ≠ fake — this line is absolute.** Placeholder copy clearly marked for pre-launch finalization: allowed. Feature flags, config-driven values, neutral/empty states designed for real data: allowed. **Fabricated statistics, testimonials, earnings, reviews, certificates, analytics, user counts, wallet balances, or any business data invented to make a page look complete: NEVER.** The product stays truthful at every commit. D-29 is a floor, not a config: even placeholder copy never promises income.

**Launch gate:** No Architecture blockers before development · **No PENDING rows in `docs/LAUNCH_CONFIG.md` before go-live.**

*Interaction with Module execution rules above:* items previously classified FOUNDER CONTENT REQUIRED / EXTERNAL DEPENDENCY are still tracked as BLOCKED in close-out reports, but the engineering around them completes to 100% with config slots, and every such item MUST have a `LAUNCH_CONFIG.md` row. Exception that stays truly blocked: work whose substance IS the missing asset (e.g., real course video) — build the full slot/player/states, register the item, move on.

## Build order (dependency-first)

1. Foundation: schema, tokens, money-core (done).
   **M1 Money Spine DONE (2026-07-03, Fable-built + verified 38/38):** all rupee paths exist as pure
   domain functions — `payments/{gst,razorpay,webhook-flow,schemas}`, `affiliate/{upline,credit,clawback}`,
   `lms/entitlement`, `wallet/{withdrawal,summary}`, `ledger/ledger` (TxSpec/AccountRef).
   **Adapters must NOT re-implement rules** — routes/server actions only: verify → load state →
   `decideWebhookActions()` → execute returned actions in ONE Prisma tx → record WebhookEvent.
2. Auth (Supabase OTP) → 3. Catalog+LMS (course player, enrollment, progress) →
3. Payments (Razorpay order+webhook) → 5. Ledger + payment-gated commission →
4. Affiliate dashboard (FULL build, payouts flag off — DR-029; only activation is D-01-gated) → 7. KYC + Withdraw (intake + PII lib now; payout execution flag-gated) → 8. Admin (RBAC) → 9. Analytics.

## Definition of done (per feature)

Types clean (`npm run typecheck`) · Zod at boundaries · tests for money/critical logic · a11y (shadcn/Radix) · no secrets in code · audit row for money/admin mutations.

## Fable review protocol (post-ticket quality gate)

- **Tier A — money, auth, schema, webhooks, legal-gated code:** MANDATORY Fable 5-lens review before merge (architecture-conformance · code · security · performance · simplification, one pass). Claude Code must end Tier-A tickets with: "Tier A — needs Fable review" + file list + test output.
- **Tier B — UI, marketing, content:** Blueprint-conformance + code skim; escalate to Tier A if the change touches routes/data/money.
- **Refactoring review:** every ~4 tickets or when a module causes repeated friction — never mid-ticket.

### Tier A merge checklist (ALL boxes required — objective, not subjective)

- [ ] `npm run typecheck` clean
- [ ] ALL tests green — unit + live integration (money paths never skipped)
- [ ] Architecture review passed (adapters thin, no rule re-implemented in routes/adapters)
- [ ] Security review passed (no secrets in code, boundaries Zod-validated, signature-before-parse, PII rules)
- [ ] Performance sanity check (no N+1 in hot paths, transactions scoped tight)
- [ ] No Blueprint v1.1 violation · no Constitution violation · no Decision Register conflict
- [ ] Docs updated if behavior changed (CLAUDE.md / blueprint copy)
- [ ] Git commit created — message: `ticket-N: <what> (Tier A, Fable-reviewed)`

### Tier B merge checklist

- [ ] `npm run typecheck` clean
- [ ] Relevant tests green
- [ ] Blueprint conformance checked (routes, tokens, gold-contrast rule, mobile-first 320px)
- [ ] Code review completed (self-review + skim)
- [ ] UI/UX verified on mobile viewport (and `prefers-reduced-motion` respected)
- [ ] Git commit created — message: `ticket-N: <what> (Tier B)`

## Open legal gates (do not violate)

Affiliate payouts OFF until **D-01** (legal). GST only if **D-03** registered. No income guarantees (**D-29**).
