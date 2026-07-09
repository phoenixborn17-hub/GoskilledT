# Phase B — Referral-Engine Activation + Affiliate Dashboard — Module Spec v1.0 (FROZEN)

> **In-repo build spec (self-contained).** Governance source: Genesis Decision Register **DR-007** (commission numbers), **DR-038** (earning gate + label/privacy defaults), **DR-034/DR-035** (compliance-safe labels), **DR-025** (held→available lifecycle). Builds on merged Phase A (DR-036/DR-038 auth). **Status: FROZEN for build.** **Do not merge — park + Tier-A packet; `main` touched only on the founder's relayed Opus authorization (GATE).**
>
> **Sequencing:** start ONLY after Phase A is merged to `main`. Cut `gps-phaseb-referral-dashboard` off **updated** `main` (Phase A included). One session per working tree.

## 0. Why DR refs aren't in the repo
The governing decisions live in the Genesis layer (outside this repo). Everything needed to build is restated below.

## 1. Goal
Make the already-built affiliate engine **complete and visible**, and **activate the DR-038 earning gate** in the commission-credit path — without enabling any payout (D-01 stays OFF). Commissions continue to credit the ledger (held→available per DR-025); this phase makes *who* earns correct and *what the affiliate sees* rich and compliant.

## 2. Decisions enforced (restated)
- **DR-007 commissions:** ₹900/150/75 (Skill Builder) · ₹1,250/250/150 (Career Booster) — numbers already in the engine; do not change.
- **DR-038 earning gate:** an affiliate earns commission on a downline purchase **only if the affiliate has their OWN confirmed (PAID) purchase.** Phase A locked+tested the rule (`canEarnCommission` / `hasConfirmedPurchase`) and left a documented hook in `lib/payments/webhook.ts`. **Phase B activates it.**
- **DR-038 labels/privacy (defaults, configurable):** "Team" → **"My Network / Referrals"**; keep "Level 1/2/3" + "Rewards"; tiers Contributor/Mentor/Champion. **Referral tables: only Level 1 exportable to sheet (CSV/XLSX); Level 2 & 3 render WITHOUT mobile numbers and are NON-exportable.**
- **Payouts remain OFF (D-01).** This phase moves no money out.

## 3. Scope split (review routing)
- **B1 — Earning-gate activation → Tier-A (Fable).** Money-credit logic. Build as a **distinct, self-contained unit** (own commits + own packet section) so Fable reviews only this.
- **B2–B6 — Surfacing (graphs, tables, page, labels) → Tier-B (Opus).** Read-only over existing ledger/graph data.

## 4. B1 — Earning-gate activation (Tier-A)
Replace the documented hook in `lib/payments/webhook.ts` (CREDIT_COMMISSIONS) with live enforcement, **inside the existing transaction**, before `buildCommissionTxns`:
- For each resolved upline, credit **only if** that upline has ≥1 own `Order.status = "PAID"` (`hasConfirmedPurchase`, read inside `tx`).
- **Ineligible upline → SKIP entirely: no credit, no roll-up to the next level** (conservative default — never pays more than earned; protects the thin referred-margin AR-1). *Roll-up is a separate founder/Fable money-policy decision — flag it, do not implement it.*
- **Eligibility is evaluated at credit time** (the moment the downline's payment verifies). **No retroactive backfill** if an upline buys later — document this as the locked behavior; flag for founder/Fable confirmation.
- **Preserve** existing idempotency keys, HELD-status lifecycle (DR-025), refund clawback, and the double-entry ledger exactly. No change to amounts (DR-007).
- Tests (money, mandatory): eligible upline credited ✓ · ineligible upline NOT credited, no roll-up ✓ · mixed chain (L1 eligible, L2 not, L3 eligible) credits only L1+L3 ✓ · refund clawback still correct ✓ · idempotent re-delivery unchanged ✓.

## 5. B2 — Dashboard graphs (Tier-B)
On the earn hub / dashboard: **Earning graph** (date filter) · **Network graph** (date + level filter) · **Payments-received graph** (month/date filter). Read-only, derived from the ledger/referral graph (no new source of truth — Art 7.5). Reuse any existing chart component; if none, add ONE dependency-light chart approach consistent with repo conventions (state choice in the packet); keep LCP/bundle in budget. Empty/zero states honest (D-29 — no fabricated numbers).

## 6. B3 — My-Referrals L1/L2/L3 tables (Tier-B, privacy-critical)
Tables per level with **date + package filters**. **Privacy (enforce server-side — never send masked fields to the client):**
- **Level 1:** full detail rows + **Export to sheet (CSV/XLSX)** button. Export is **server-generated, L1-only, rate-limited**.
- **Level 2 & 3:** rows render **WITHOUT mobile numbers** (and no other PII beyond first name/count as today) and are **NOT exportable** (no export button, server refuses L2/L3 export).
Reuse the existing masked referral-graph read (Phase-A/M3 `referredById` source, Fable-approved).

## 7. B4 — Wallet graphs (Tier-B)
Add wallet detail graphs (held vs available over time, derived from ledger). DR-025 explainer stays. No withdraw changes here (that's Phase C).

## 8. B5 — Commission-Structure page (Tier-B)
A content page showing the DR-007 two-package structure (₹900/150/75 · ₹1,250/250/150) with the 3-level model. Compliance-safe framing (learning-first; no income guarantees — D-29). Copy slots → LAUNCH_CONFIG where founder-final.

## 9. B6 — Labels (Tier-B, Layer-2 copy)
Apply the DR-038 defaults where these surfaces render: "Team"→"My Network/Referrals"; keep Level 1/2/3. (Leaderboard & Rewards are **Phase D** — not here.) Keep labels configurable.

## 10. Security · privacy · D-29
Server-side masking for L2/L3 (mobile never leaves the server for those levels); export authorization checks the level server-side; all graphs/tables derive from canon (rebuildable, Art 7.5); zero fabricated data; payouts stay OFF (no withdraw execution).

## 11. Non-regression
Existing `/dashboard/earn`, wallet, commissions, referrals pages keep working; ledger idempotency + clawback + amounts unchanged; full suite green.

## 12. Acceptance tests (must pass)
B1 money tests (§4) · L1 export produces a sheet, L2/L3 export refused server-side · L2/L3 rows contain no mobile number (asserted on the server payload) · graphs render with honest empty/zero states · commission-structure page shows DR-007 numbers · full existing suite green · tsc/lint/prettier clean.

## 13. Out of scope
Real payouts / withdraw execution (D-01, Phase C) · KYC expansion (Phase C) · Leaderboard + Rewards + My-Leads (Phase D) · roll-up of ineligible commission (founder/Fable decision, not built).

## 14. Change log
- v1.0 — 2026-07-10 (Opus, steward) — frozen from GoSkilled Full-Functional Spec v2 Phase B + DR-007/DR-038/DR-034/DR-035; B1 Tier-A money slice carved out for Fable.
