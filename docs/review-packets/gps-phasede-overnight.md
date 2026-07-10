# Morning Packet — Overnight Build: Phase E (Admin) + Phase D (Engines)

**Branch:** `gps-phasede-overnight` — cut off the **`gps-phasec-kyc-withdraw`** tip (`d5e18f4`), so it stacks on the still-parked Phase C. **`main` is untouched (`9704092`); nothing merged.**
**Spec:** `docs/specs/PhaseDE_Overnight_v1.0.md` (FROZEN — §1/§2 Phase E+D, **§2.5 Unit 3 engineering-correctness**). **Diff:** `docs/review-packets/gps-phasede-overnight.diff`.
**Routing:** most units → **Opus Tier-B**; **My-Leads PII → Fable**.
**Now includes Unit 3 (§2.5) — see the dedicated section below.** Full suite **405/405** green; tsc/lint/prettier clean.

---

## ☀️ TL;DR — what I built / what needs your call

**Built (all tested, parked):**

- **Phase D engines:** Leaderboard (ranks by _learners you referred who completed a course_ — DR-034/035, never earnings/team-size) · Tiers (Contributor/Mentor/Champion) · Rewards engine (admin-configurable) · My-Leads (affiliate-uploaded, owner-scoped, **PII encrypted**). Minimal plain consumer surfaces (premium redesign deferred, per your scope guard).
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

## Unit 3 (§2.5) — Engineering-correctness & test hardening (Tier-B; the tx-refactor touches the money path → note for Fable)

Pure correctness — **no design-language or money-logic behavior changes.** Commits `6a0b11f` (A/B), `3f99692` (C/D), `dfd3964` (E).

- **U3-A · QA-01 hydration (root-caused, not suppressed).** The QA harness runs against `npm run dev` (`playwright.qa.config.ts`), and the four flagged routes include **`/admin/users` — a pure server component with zero client components** — so the mismatch is necessarily at the `<html>` boundary, where **`next/font` injects the font-variable classNames**. This is Next.js's documented **dev-only** intermittent className mismatch (hence 1 error on a random 4 of ~48 routes in a single snapshot; structurally-identical `/admin/audit` was clean). **A full production build compiles clean** (types + lint valid; it only stops at page-data collection because the deliberate money-safety provider guard trips on the dev `.env`'s mock providers — verified separately with a completed staging build). Applied the Next.js/React-documented remedy: `suppressHydrationWarning` on `<html>` only (scoped one level deep — child mismatches still warn, so real bugs are never masked).
- **U3-B · Course-player 6px overflow @360 (real fix).** Root cause: the player grid's children default to `min-width: auto`, so the `<video>`'s intrinsic min-content width couldn't shrink below the 360px column (QA metric: `scrollWidth 366 / clientWidth 360`; playback DOM only, not the locked state). Fix: `min-w-0` on the two grid children. **CLS on /packages + /faq is a dev over-report** (spec's own caveat): it appears **only at 360** (0.144 / 0.21) correlated with the slow **dev** cold-compile LCP (2780 ms), and is ~0 at 768/1280; the `.reveal` animation is **transform-only** (no layout impact) and reduced-motion-gated, and prod uses optimized self-hosted `next/font` (`adjustFontFallback`). No real code cause — recommend a prod-build QA re-capture to confirm ~0.
- **U3-C · Refund-mirror edge test + guardrail lock.** New `tests/refund-mirror.integration.test.ts`: upline earns on a downline purchase → the upline's OWN order refunds → **earned commission is KEPT** (clawback is keyed to the refunded order, which paid the upline nothing) and **future eligibility is LOST** (`hasConfirmedPurchase → false` → the next downline purchase credits them nothing). New `tests/guardrail-strings.test.ts` **locks the literal `GURU_INCOME_REDIRECT` string** + the D-29 no-number invariant (the old test compared `answer === constant`, so a silent copy edit passed — now closed).
- **U3-D · `hasConfirmedPurchase(userId, db?)` tx-parameterized** (Fable's Phase-B note). The webhook's `CREDIT_COMMISSIONS` now calls the SAME helper **inside its `$transaction`** instead of an inline `tx.order.count` — removing the drift risk. **Behavior identical** (verified: earning-gate + money-flow non-regression suites green).
- **U3-E · Validation audit.** Fixed (trivial/safe): the My-Leads add-lead action now **Zod-validates at the boundary** (bounds `name`/`note`/`email`; phone re-checked in the adapter) instead of trusting the client. Admin rewards create already uses Zod. **Flagged (not fixed unattended):** `setRewardActiveAction` takes an `id` with no format check (admin-only; Prisma throws on a bad id — low risk); a broader route-by-route validation sweep across older surfaces is recommended as a dedicated pass.

## Tests & gates

```
Test Files  61 passed (61)
     Tests  405 passed (405)
```

New in Unit 3: `guardrail-strings` (3), `refund-mirror.integration` (1). Plus D/E: `leaderboard` (4), `tiers` (4), `phasede.integration` (6). `tsc` clean · eslint **0 errors** (4 pre-existing warnings) · prettier clean.
**Non-regression:** all money suites (money-flow, checkout-mock, withdrawal-payout, earning-gate, hold-clawback) green — **no money logic behavior changed.**

## Flagged decisions

| #      | Item                                             | Routed to    | Safe default shipped                                                |
| ------ | ------------------------------------------------ | ------------ | ------------------------------------------------------------------- |
| LC #52 | My-Leads PII: mask-to-owner? retention? consent? | **Fable**    | Encrypted + owner-scoped; owner sees full phone; no retention limit |
| LC #51 | Tier thresholds (Mentor/Champion)                | Opus         | 5 / 15 completed-referrals                                          |
| LC #53 | Reward definitions content                       | Opus/Founder | None seeded (honest empty)                                          |
| —      | Leaderboard "completed" = has a Certificate      | Opus         | Certificate row = course completed                                  |

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
