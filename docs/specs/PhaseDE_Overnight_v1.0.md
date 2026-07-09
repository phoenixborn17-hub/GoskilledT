# Phase E (Admin Expansion) + Phase D Engines — Overnight Build Spec v1.0 (FROZEN)

> **In-repo build spec (self-contained). Autonomous overnight run — the founder is asleep and will review in the morning.** Governance: DR-037/D-01 (payouts OFF), DR-025 (held→available), DR-034/DR-035 (learning-first framing), D-29 (no fabricated data). Tier: **B (Opus) for most; anything touching money/PII → flag for Fable.**
>
> **Branch:** cut `gps-phasede-overnight` off the current **`gps-phasec-kyc-withdraw`** tip (so you have A+B+C). One session per working tree.
> **HARD RULES:** (1) **DO NOT MERGE anything — `main` stays untouched** (GATE; the founder isn't awake to authorize). (2) Commit + **park each logical unit** with tests. (3) Keep the suite green + tsc/lint/prettier clean at each unit. (4) **Never fabricate data (D-29)** — real aggregates or honest designed empty states only. (5) **Payouts stay OFF** — do not add any disbursement path. (6) When a decision is genuinely ambiguous or touches money/PII policy, **build the safe default and FLAG it in the morning packet — do not block the whole run.**

## 0. SCOPE GUARD — what NOT to build tonight
The **consumer-facing dashboard is being redesigned** (a fresh "bold & colorful" direction, not yet approved). So tonight: build **engines + data + admin surfaces + only minimal/functional consumer surfaces**. **Do NOT invest in premium consumer dashboard UI** for Leaderboard/Rewards/My-Leads — keep those consumer surfaces plain and logic-clean so they can be restyled later with zero logic rework. Admin surfaces DO get the normal functional (charcoal) treatment.

## 1. Phase E — Admin Panel Expansion (Tier-B)
- **Admin dashboard graphs** (`/admin`): real-aggregate KPIs only (registrations, purchases, commissions held/available, withdrawals by status, KYC pipeline counts). Charts = **inline-SVG / lightweight** (no heavy chart lib, per the perf research). Honest empty/zero states pre-data.
- **Wallet-manage (admin):** read-only admin view of affiliate wallet/ledger balances + history (held/available/paid), audit-safe; no money movement.
- **Consistency pass:** ensure the admin **KYC review** (new Phase-C fields + reveal-logged docs), **Withdrawals** (Applied→In-Progress→Paid), and **Webinar** manage screens are complete and coherent with the new data.

## 2. Phase D — Engagement Engines (Tier-B; engines + admin now, premium consumer UI later)
- **Leaderboard engine:** rank by **referred-learners-who-completed a course** (DR-034), **never** by earnings or raw team size (DR-035). Pure/tested ranking query + a **minimal** consumer surface + admin visibility. Privacy: reuse the L2/L3 masking rules from Phase B.
- **Rewards / tiers engine:** Contributor → Mentor → Community Champion based on completed-referrals/contribution (DR-035). Reward definition model (target · last-date · description · achieve-progress) — **admin-configurable**; pure tier computation + tests. Minimal consumer surface only.
- **My-Leads:** data model + **affiliate upload** (leads table with date filter) + basic table + validation. Store safely (owner-scoped; if any PII, follow the Phase-C encryption/privacy pattern → **flag for Fable** in the packet).
- All three: **derive from canon, honest states, no fabricated numbers.**

## 3. Security / correctness
Server-enforce all authorization (admin-only for admin surfaces; owner-scoped for affiliate data). No PII in logs. Reuse existing patterns (`lib/pii`, masking, `recordAdminAction` audit). Non-regression: do not alter ledger/commission/withdraw money logic — additive only; existing money suites must stay green.

## 4. Acceptance (per unit)
Each unit ships with tests: admin graphs render from real aggregates + honest empty states; wallet-manage is read-only + authorized; leaderboard ranks by completion (test the DR-035 rule — earnings/team-size must NOT rank); tiers compute correctly; my-leads upload validated + owner-scoped; full suite green; tsc/lint/prettier clean; **no money movement anywhere**.

## 5. Morning deliverable (for founder + Opus/Fable review)
One **consolidated Review Packet** (`docs/review-packets/gps-phasede-overnight.md`) with: per-unit summary, commit list, test counts, non-regression confirmation, and a clear list of **flagged decisions / ambiguities** (money/PII items routed to Fable; the rest to Opus Tier-B). `main` untouched; nothing merged. A short "what I built / what needs your call" summary at the top.

## 6. Out of scope
Real disbursement (D-01) · the premium consumer dashboard redesign (separate design track) · anything requiring a founder decision mid-run (flag instead).

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — overnight autonomous build scope: Phase E admin expansion + Phase D engines; consumer premium UI deferred to the redesign; park-don't-merge; morning packet.
