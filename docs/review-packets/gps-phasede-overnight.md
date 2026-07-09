# Morning Packet — Overnight Build: Phase E (Admin) + Phase D (Engines)

**Branch:** `gps-phasede-overnight` — cut off the **`gps-phasec-kyc-withdraw`** tip (`d5e18f4`), so it stacks on the still-parked Phase C. **`main` is untouched (`9704092`); nothing merged.**
**Spec:** `docs/specs/PhaseDE_Overnight_v1.0.md` (FROZEN). **Diff (D/E only):** `docs/review-packets/gps-phasede-overnight.diff`.
**Routing:** most units → **Opus Tier-B**; **My-Leads PII → Fable**.

---

## ☀️ TL;DR — what I built / what needs your call

**Built (all tested, parked):**
- **Phase D engines:** Leaderboard (ranks by *learners you referred who completed a course* — DR-034/035, never earnings/team-size) · Tiers (Contributor/Mentor/Champion) · Rewards engine (admin-configurable) · My-Leads (affiliate-uploaded, owner-scoped, **PII encrypted**). Minimal plain consumer surfaces (premium redesign deferred, per your scope guard).
- **Phase E admin:** `/admin` real-aggregate KPI graphs (inline-SVG, honest empty states) · read-only `/admin/wallet` (affiliate balances + history, **no money movement**) · admin `/admin/rewards` (configure rewards + leaderboard visibility) · nav wired · KYC/withdrawals/webinar confirmed coherent.
- **Non-regression:** existing money suites all green; **no ledger/commission/withdraw logic changed.** Payouts stay OFF (D-01).

**Needs your call (flagged, safe defaults shipped — nothing blocked):**
1. **My-Leads PII policy → Fable** (LC #52): leads' phone/email are encrypted at rest + owner-scoped, but the owner currently sees their own leads' **full** phone. Mask even to owner? Retention window? Consent copy?
2. **Tier thresholds** (LC #51): defaulted Mentor ≥5 / Champion ≥15 completed-referrals. Confirm numbers.
3. **Reward definitions** (LC #53): none seeded (honest empty) — you create them in `/admin/rewards`.

---

## Per-unit summary

### Schema (`1a41ade`) — additive migration `20260710130000_phasede_rewards_leads` (applied; RLS on both)
`RewardDefinition` (admin-configurable: title/description/metric/target/lastDate/isActive) · `AffiliateLead` (owner + encrypted phone/email + status). Named `AffiliateLead` (not `Lead`) to avoid clobbering the existing CRM `Lead` table.

### Phase D engines + consumer surfaces (`3affaf0`)
- **Leaderboard** (`modules/affiliate/leaderboard.ts` pure + `lib/affiliate/leaderboard.ts`): ranks affiliates by count of direct referrals with a `Certificate` (completed a course). **Earnings/team-size aren't even inputs** (DR-035). Privacy: first names + counts only.
- **Tiers** (`modules/affiliate/tiers.ts`): pure `computeTier`/`tierProgress`; thresholds config (LC #51).
- **Rewards** (`lib/affiliate/rewards.ts` + admin CRUD `lib/admin/rewards.ts`): progress derived from completed-referrals; admin-configurable definitions.
- **My-Leads** (`lib/affiliate/leads.ts`): owner-scoped; phone/email **AES-256-GCM encrypted** (Phase-C pattern), validated, never logged. ⚠️ PII → Fable.
- **Consumer surfaces** (`/dashboard/earn/{leaderboard,rewards,my-leads}`): plain/logic-clean, ready to restyle in the redesign; honest empty states (D-29).

### Phase E admin (`b3e7138`)
- **E1 KPI graphs** (`lib/admin/kpi.ts` + `/admin`): registrations, purchases, commissions-credited, withdrawals-by-status, KYC pipeline — all from real aggregates via the existing `MiniChart`; held/available snapshot (DR-025). Empty in → empty chart.
- **E2 wallet-manage** (`lib/admin/wallet.ts` + `/admin/wallet[/[userId]]`): **read-only** affiliate balances + history from the ledger. No actions, no money movement.
- **E3 consistency + nav:** admin rewards page (+ leaderboard visibility); `Wallets` + `Rewards` nav tabs added. KYC (Phase-C fields/docs), Withdrawals (In-Progress), Webinar confirmed complete/coherent — no changes needed.

## Tests & gates
```
Test Files  59 passed (59)
     Tests  401 passed (401)
```
New: `leaderboard` (4), `tiers` (4), `phasede.integration` (6 — completion-not-team-size, reward progress, **lead PII encryption + owner-scoping**, KPI shape). `tsc` clean · eslint **0 errors** (4 pre-existing warnings) · prettier clean.
**Non-regression:** all money suites (money-flow, checkout-mock, withdrawal-payout, earning-gate, hold-clawback) green — **no money logic touched.**

## Flagged decisions
| # | Item | Routed to | Safe default shipped |
|---|---|---|---|
| LC #52 | My-Leads PII: mask-to-owner? retention? consent? | **Fable** | Encrypted + owner-scoped; owner sees full phone; no retention limit |
| LC #51 | Tier thresholds (Mentor/Champion) | Opus | 5 / 15 completed-referrals |
| LC #53 | Reward definitions content | Opus/Founder | None seeded (honest empty) |
| — | Leaderboard "completed" = has a Certificate | Opus | Certificate row = course completed |

## Notes / honest gaps
- **Stacks on parked Phase C** (`d5e18f4`) — this branch can't merge until Phase C merges first. Diff is D/E-only.
- Auth-gated dashboard/admin pages verified via typecheck + integration tests of their adapters (no preview login session in an autonomous run).
- Two additive migrations were **applied to the shared Supabase** (Phase C's + this one) so integration tests run; the files land on `main` when the respective branches merge.
- `getMyLeaderboardStanding` does a full-population scan (fine pre-launch; optimize if the population grows).

## Checklist
- [x] `tsc` clean · 401/401 tests · eslint 0 errors · prettier clean
- [x] Additive only; RLS on new tables; no money logic changed; payouts stay OFF (D-01)
- [x] No fabricated data — real aggregates or honest empty states (D-29)
- [x] Commits parked; **`main` untouched (`9704092`)**; nothing merged
- [ ] Opus Tier-B review (D/E) · [ ] **Fable** (My-Leads PII) · [ ] founder authorization (GATE) — all pending
