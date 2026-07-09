# Review Packet — Phase B: Referral-Engine Activation + Affiliate Dashboard

**Branch:** `gps-phaseb-referral-dashboard` (cut from `main` @ `9635893`, Phase A included)
**Spec:** `docs/specs/PhaseB_Referral_Engine_Dashboard_v1.0.md` (FROZEN) — DR-007 · DR-038 · DR-034/035 · DR-025.
**Status:** PARKED — **do not merge.** Awaiting review + founder-relayed Opus authorization (GATE).
**Diff:** `docs/review-packets/gps-phaseb-referral-dashboard.diff` (23 files, +~1.5k).
**Review routing:** **B1 = Tier-A (Fable)** — the money slice, its own commit `a1b71fb`. **B2–B6 = Tier-B (Opus)** — surfacing, commit `72b9741`.

---

## PART 1 — B1: DR-038 earning-gate activation (Tier-A · Fable)

**One commit, self-contained:** `a1b71fb`. Files: `lib/payments/webhook.ts`, `modules/affiliate/eligibility.ts` (comment only), `tests/earning-gate-webhook.integration.test.ts` (new), `tests/integration/money-flow.integration.test.ts` + `tests/checkout-mock.integration.test.ts` (fixtures).

### What changed
In `CREDIT_COMMISSIONS` (inside the existing `$transaction`, before `buildCommissionTxns`): each resolved upline is credited **only if** they have ≥1 own `Order.status = "PAID"`, read **inside `tx`** via `canEarnCommission({ hasOwnConfirmedPurchase: (await tx.order.count(...)) > 0 })`. Ineligible uplines are dropped from the `uplines` array; if none remain, no commission txns are created.

### Invariants preserved (verify)
- **No roll-up:** filtering happens AFTER `resolveUplines`, so each surviving hop keeps its original `level` (and thus its DR-007 amount). A skipped L2 does NOT promote L3 to the L2 amount. (Test: mixed chain → L3 credited at ₹150, not ₹250.)
- **Credit-time eligibility, no backfill:** evaluated at the instant the downline's payment verifies; a later upline purchase does not retroactively credit past downline sales. **Locked behaviour — flagged for confirmation (see Open Questions).**
- **Idempotency / HELD (DR-025) / clawback / amounts (DR-007):** untouched — same idempotency keys, same `buildCommissionTxns`, same `holdUntil`, same clawback path over the persisted (eligible) commissions.

### B1 money tests (all green, live Postgres) — spec §4
| Scenario | Result |
|---|---|
| eligible upline (own PAID) → credited | ✅ |
| ineligible chain (no purchases) → 0 commissions, no roll-up | ✅ |
| mixed chain (L1✓, L2✗, L3✓) → credits ONLY L1 + L3, each at its own level amount | ✅ |
| refund → clawback reverses the eligible commissions; wallets net 0 even after the hold | ✅ |
| duplicate delivery → idempotent (credits not doubled) | ✅ |

### Fixture change (non-regression, expected)
`money-flow` + `checkout-mock` seeded uplines **without** their own purchase, so under the now-active gate they'd correctly earn 0. Each upline is now seeded a `PAID` order so those flows exercise the **eligible** path — **all original assertions (3 commissions, ₹1250/250/150, HELD, clawback→0, idempotent) are unchanged.** This is the gate working, not a regression.

### ⚠️ Open Question flagged for founder/Fable (NOT implemented, per spec §13)
**Roll-up of ineligible commission.** Current behaviour = **skip, no roll-up** (conservative — never pays more than earned; protects the thin referred margin, AR-1). The alternative (promote L3 into a skipped L2's slot/amount) is a **money-policy decision** deliberately left to the founder/Fable. Related: **no retroactive backfill** when an upline buys later — also locked, also needs a nod. Neither is built.

---

## PART 2 — B2–B6: Surfacing (Tier-B · Opus)

Commit `72b9741`. All read-only over canon (ledger + referral graph); no new source of truth (Art 7.5); payouts stay OFF (D-01); zero fabricated data (empty in → empty out).

- **B2 graphs** — `components/affiliate/mini-chart.tsx` (dependency-light SVG bar/line; **chose hand-rolled over adding a chart dep** — no charting lib was installed, matches the repo's SVG style, zero bundle cost, accessible via sr-only table + gold-fill/charcoal contrast). Earnings + Payments-received on the hub (post-flag); Network-growth on the network page. `lib/affiliate/analytics.ts` (pure IST bucketing) + `lib/affiliate/graph-queries.ts` (adapters).
- **B3 My-Network** — `/dashboard/earn/network` L1/L2/L3 tables, date + package filters (zero-JS link chips). **Privacy enforced in the read** (`lib/affiliate/network.ts`): L1 = first name + **masked** mobile (`maskLast4`) + packages, **exportable**; L2/L3 rows are `{ joinedAt }` only — the query `select` never reads name/phone, so they cannot leak. Export = `network/export/route.ts`, **L1-only (refuses L2/L3 server-side, 403)**, auth'd to the user, rate-limited; full mobile appears only in the server-generated CSV, never in a page payload.
- **B4 wallet graph** — balance-over-time (cumulative ledger) on the wallet page; held/available split unchanged; DR-025 explainer kept.
- **B5 rewards structure** — `/dashboard/earn/commission-structure` renders DR-007 from the engine (`commissionStructure()`), compliance-safe copy (D-29). **Gated behind the payouts flag (D-01)** — pending state until the programme is legally live.
- **B6 labels** — `lib/affiliate/labels.ts` "My Network" + "Level 1/2/3" + "Rewards structure" (no "Team/Downline"; DR-034/035). Subnav updated.

### B2–B6 acceptance tests (spec §12) — all green
| Test | Result | Evidence |
|---|---|---|
| L2/L3 rows contain no mobile (asserted on server payload) | ✅ | `affiliate-network.integration` — `Object.keys(row) === ["joinedAt"]` |
| L1 export produces a sheet; L2/L3 export refused server-side | ✅ | `network-export-route` (level 2/3 → 403; level 1 → 200 CSV) |
| L1 export includes the real mobile (server-only) | ✅ | `affiliate-network.integration` |
| graphs render with honest empty/zero states | ✅ | `MiniChart` empty branch; `affiliate-analytics` (empty in → empty out) |
| commission-structure shows DR-007 numbers | ✅ | `commission-structure` (₹900/150/75 · ₹1250/250/150) |
| bucketing / CSV serializer | ✅ | `affiliate-analytics` (7) |

---

## Full test run
```
Test Files  52 passed (52)
     Tests  358 passed (358)
```
`tsc` clean · eslint 0 errors (4 pre-existing warnings, untouched files) · prettier clean.
Non-regression: existing earn/wallet/commissions/referrals + all money-path suites green.

## Self-assessment (5 lines)
1. **B1 is money-safe & minimal:** the gate is one filter loop inside the existing tx; idempotency/HELD/clawback/amounts untouched; 5 dedicated scenarios + the two updated end-to-end flows prove it.
2. **Privacy is enforced where it can't be bypassed** — at the DB `select` and the export route, not in the component; asserted on the server payload.
3. **No new source of truth:** every graph/table derives from the ledger + referral graph; empty states are honest (D-29); payouts remain OFF.
4. **Scope held to the spec:** no Leaderboard/Rewards/My-Leads (Phase D), no payout/KYC (Phase C); roll-up + backfill flagged, not built.
5. **Honest gaps:** auth-gated dashboard pages verified via typecheck + integration tests of their adapters (no preview login session); browser screenshots not captured this session.

## Deviations & notes
- **Hand-rolled chart** instead of a charting dependency (rationale above) — stated per spec §5.
- **Commission-structure page is D-01-gated** (payouts flag): showing fixed reward ₹ amounts of a not-yet-legal programme pre-D-01 would be premature; it renders the pending state until the flag flips. Conservative D-29/D-01 choice — flag if you'd prefer it visible pre-launch.
- **L2/L3 rows show join date only** (no first name), slightly stricter than "first name/count" — consistent with the existing M3 privacy stance (names hidden below L1). Easy to relax if desired.
- **Auth-gated pages not browser-verified** (no preview session); data logic is covered by unit + integration tests.

## Tier-A (B1) merge checklist
- [x] `tsc` clean · all tests green (money paths never skipped)
- [x] Adapter stays thin; no rule re-implemented; gate reads inside the tx
- [x] Idempotency / HELD (DR-025) / clawback / DR-007 amounts preserved
- [x] No Blueprint/Constitution/Decision-Register conflict
- [x] Commit `a1b71fb` created — **parked, not merged**
- [ ] **Fable Tier-A PASS** — pending · [ ] **Founder-relayed Opus authorization (GATE)** — pending
