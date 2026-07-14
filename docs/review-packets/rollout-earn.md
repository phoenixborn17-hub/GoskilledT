# Review Packet — Vibrant Rollout · Slice C: Earn Hub + Wallet/KYC Interiors (Tier A, PARKED)

**Branch:** `gps-rollout-earn` (off `main@1565e8b`) · **Date:** 2026-07-15 · **Status: PARKED — no merge**
**Directive:** founder-locked v5 rollout, Slice C (Earn + money/PII interiors) — doubles as the
long-pending **Command Center Spec Slice 4** (Wallet + money-trust anchor, §4.2).
**Spec:** `docs/specs/Vibrant_CardSystem_Amendment_v1.0.md` §5 · `docs/specs/Command_Center_Dashboard_Spec.md`
§4.2 (Anchor B) / §5.4 (money-row treatment) / Slice 4 acceptance criteria.
**Tier:** **A — money + PII surface.** Display re-skin only, but this packet requires an
**INDEPENDENT Tier-A review (Fable or a fresh session — NOT this builder) before merge.** GATE: no
self-merge.

---

## 1 · What changed

Composed the promoted Vibrant Card System onto every Earn workspace interior named in the
directive:

| File | What |
|---|---|
| `app/dashboard/earn/page.tsx` | `vh-hero` header + 4-card key-metric row (`VibrantMetricCard`): gold-vault **Available** (focal, when >0) · cyan **Held** (a clearing *status*, not the earn family — keeps de-clustering even with 3 money cards on the row) · gold **Total earned** · indigo **Active friends** (`NetworkNodes`, `CountUp` — non-money). Referral object, entry cards, tabs stay on the calm dc-recipe (same restraint as Home/Learn hub slices). |
| `app/dashboard/earn/wallet/page.tsx` + `components/affiliate/wallet-summary.tsx` | Gold-vault focal `VibrantMetricCard` for Available, cyan-status card for Held. Balance graph / Withdraw / History / Clearing-soon panels re-skinned onto `vh-card` (earn/cyan). Money-row treatment on History (right-aligned tabular ₹, `text-success` for credits). `held-credit-row.tsx` token-migrated. |
| `app/dashboard/earn/commissions/page.tsx` | Money-row table: right-aligned tabular ₹, status **chip tones** (held-amber / available-green / cancelled-neutral) replacing plain text state labels. |
| `app/dashboard/earn/commission-structure/page.tsx` | `vh-card` earn-soft panels per package; level amounts on `vh-text` (amber, AA-safe on light — **not** `vh-gold-num`, see §2). |
| `app/dashboard/earn/network/page.tsx` + `components/affiliate/referral-tree.tsx` + `.../referrals/page.tsx` | Indigo network accent throughout; level-count summary now `VibrantMetricCard`-style tiles with `CountUp` (non-money); filters/tables token-migrated (`text-charcoal`→`text-ink` etc.). |
| `app/dashboard/earn/leaderboard/page.tsx`, `.../rewards/page.tsx` | Purple achievement accent; rewards hero tier card is a `vh-bold` focal; progress bar recolored to the achievement gradient. |
| `app/dashboard/earn/kyc/page.tsx` + `components/affiliate/kyc-form.tsx` | Cyan status accent for Under-review/pending states; Verified state on `bg-success/5`/`text-success` (not a vibrant accent — a plain success state, unrelated to the six-family map); form's verified checkmarks/submit-confirmation recolored to `text-success`; the OTP-verify "Verify" button recolored via `vh-delta` (inherits cyan from the page wrapper). Encryption/Zod/upload logic untouched. |
| `components/affiliate/payout-status-line.tsx`, `.../withdraw-form.tsx` | Token/accent migration only — copy byte-identical. |

**Diffstat:** 15 files, +392/−292. **`git diff main...HEAD -- lib modules` → EMPTY** (verified below).

## 2 · MONEY-LOCK re-check (explicit, per directive)

- [x] **safeMoney/DataValue everywhere, STATIC.** Every ₹ value in the touched files renders through
      `<DataValue value={safeMoney(...)} />` (Earn hub Available/Held/Total-earned, Wallet Available/
      Held, Commissions table + footer, History rows via plain `formatINR` unchanged from before —
      those were never a fail-safe path since the ledger read is guaranteed non-null, matching the
      pre-existing convention). **Zero `<CountUp>` on any rupee value** — grepped every touched file
      for `CountUp` next to a money field; the only `CountUp` usages are non-money (course/friend
      counts, referral-tier counts).
- [x] **`vh-gold-num` (pale gilded numerals) used ONLY on dark `.vh-bold` focals** — caught and fixed
      two spots during self-review where it had been applied to a **light** `.vh-soft`/`vh-plate-grad`
      tint (Earn hub "Total earned" card, commission-structure level amounts): pale gold on a light
      background would have violated Rule 14 (gold never text on light). Both now render on `vh-text`
      (amber `#8A5A00`, the accent's AA-safe light-tint text token) or plain `text-ink`.
  - Wallet's `vh-gold-num` on **Available** (a `vh-bold` dark focal) is correct and unchanged from
    that pattern's first use on Home Slice A.
- [x] **Held/Available honest.** Wallet's `canWithdraw` gate, held-credit countdowns
      (`getHeldCredits`/`HeldCreditRow`), and history are byte-identical reads — only the surrounding
      markup/classes changed. Held always renders as a distinct cyan-status card, never merged into
      or confused with Available.
- [x] **DR-043 "recorded / payouts open at launch" — never "ready to withdraw" while D-01 is closed.**
      Fixed during self-review: the Earn hub's Available/Total-earned captions were initially fixed
      strings ("Ready to withdraw." / a payouts-open sentence unconditionally) — corrected to branch
      on the real `d.payoutsOpen` flag, mirroring Home's `EarnSlot` pattern exactly. Verified live
      (payouts OFF in this dev env): Wallet renders `WalletPending` ("recorded & safe... payouts open
      soon"), Commissions/Commission-structure/KYC all render their honest money-pending states.
- [x] **Payouts OFF (D-01) — no live "Paid"/withdraw.** `payoutsEnabled()` gate is untouched;
      `WalletMoney` (the flag-ON branch) could not be live-exercised in this dev DB (flag is off here)
      — verified by full code read instead: `canWithdraw` computation, `WithdrawForm` render
      condition, and the `pending`/`kycVerified` fallback branches are byte-identical to pre-reskin.
- [x] **Eligibility gating intact (§D/DR-038).** `EarnPage`'s `!d.eligible ? <NotEligible> :
      <FullDashboard>` fork is untouched — same condition, same components swapped only in their
      internal JSX. **Live-verified** with the non-eligible test account: `NotEligible` renders (no
      share-to-earn, no wallet card, no rupee figure except the static commission-range copy
      "₹150–₹250 per referral" — unchanged pre-existing text, not a balance).
- [x] **DR-038 masking intact (L2/L3 mobile-masked).** `network/page.tsx`'s L1 table still reads
      `r.mobileMasked` from `getReferralNetwork` (untouched); L2/L3 render "GoSkilled learner" + join
      date only, same as before — zero new fields added to any row. `referral-tree.tsx`'s L2/L3
      privacy copy is verbatim.
- [x] **`git diff main...HEAD -- lib modules` → EMPTY.** Ran explicitly before and after the full
      session; confirmed zero bytes changed in either directory — every change is presentation
      (`app/dashboard/earn/**/page.tsx`, `components/affiliate/*.tsx`).

## 3 · WCAG AA checklist

- [x] Gold never text on light (see §2 `vh-gold-num` fix — the one place this could have regressed,
      caught and corrected before commit).
- [x] Color never the only signal: commission status uses chip **text label + tone**; wallet history
      sign uses **+/− glyph + color**; KYC verified/rejected states carry an icon + text, not color
      alone.
- [x] Reuses accent CSS vars already AA-verified on Home/Learn Slices A/B (amber `#8A5A00`, indigo
      `#4338CA`, purple `#6D28D9`, cyan `#0E7490` on light tints; white/gilded on dark focals) — no
      new colors introduced.
- [x] Whole-card `VibrantMetricCard` links keep visible focus rings (inherited, unchanged component).

## 4 · Live-verified (dev server, `next-dev`, demo test user — payouts flag OFF, non-eligible)

- **Earn hub:** `NotEligible` fork renders correctly — hero band, "Step 1 — get your package" card,
  commission-range copy, zero share-to-earn affordance, zero console errors.
- **Wallet:** `WalletPending` honest state (vh-card earn-soft), Notify-me toggle present, no ₹ promise.
- **Commissions / Commission-structure / KYC:** all three render their money-pending vh-card state
  ("Opens after review" / "KYC verification opens with the programme") — honest, no fabricated data.
- **Network:** filters + 3-level tables render (test DB has real seeded packages/rows); zero console
  errors; table `overflow-x-auto` confirmed — no horizontal page overflow at 375px.
- **Referrals:** honest zero ("No invites yet"), share block intact.
- **Leaderboard:** real completed-referral counts render (2 each, from seed data), "you" row styling
  applies `vh-text`, no earnings shown — ranking is by completions only, as designed.
- **Rewards:** tier card (`vh-bold` achievement focal) + per-reward progress bars render with real
  `0 / target` counts, no fabricated progress.
- **Mobile (375px):** `scrollWidth <= clientWidth` on both Earn hub and Network (widest content) —
  no overflow.
- **Not exercised live** (flag/data limitations of this dev DB, same caveat as prior Slice B packet):
  `WalletMoney` (flag-ON branch: gold-vault Available, clearing stack, money-row history with a
  non-zero balance), and the KYC form's Verified/Under-review/Rejected states (no test account had
  submitted KYC). All four were verified by full code read instead — see §2.

## 5 · Green checklist

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — 0 errors (4 pre-existing warnings, unrelated files)
- [x] `npx prettier --write` applied to all 15 changed files
- [x] `next build` — compiles successfully (webpack + typecheck pass); production build then hits the
      known-by-design dev-provider guard on `/api/webhooks/razorpay` page-data collection (local
      `PAYMENT_PROVIDER=mock` etc.) — unrelated to this change, same as every prior packet
- [x] `npm test` — **483/483 passed**, including the full `earning-gate-webhook.integration.test.ts`
      (DR-038, Tier-A) and `quiz-cert-gate.integration.test.ts` suites — money-path tests untouched
      and green

## 6 · Known limitations / follow-ups (not blockers)

1. `WalletMoney` (payouts-ON branch) and KYC's Verified/Under-review/Rejected states were verified by
   code read, not live render — no seeded test account in this dev DB has a non-zero available
   balance or submitted KYC. Recommend the independent Tier-A reviewer either exercise these on
   staging (which has a demo account with recorded earnings, per `staging-live-and-rich-zero`
   session notes) or accept the code-level verification.
2. `ShareBlock`, `mini-chart.tsx`, `qr-code.tsx` were left on their existing styling (not part of the
   Vibrant recipe) — out of scope for this slice, low visual risk, already used app-wide.
3. A few residual legacy tokens remain in `kyc-form.tsx` (e.g. `text-xs text-muted` on two helper
   lines, the shared `Input`/select control styling) — left untouched to avoid scope creep on a Tier-A
   PII surface; flagged as `PRODUCT_DEBT.md`-eligible if the founder wants full Wave-V2 purity later.
4. This is the last Vibrant rollout slice per the spec's §5 plan (Home → Learn → Earn/wallet) — the
   Command Center Spec's five-slice plan (§6) has additional non-vibrant anchors (player focus mode,
   journey-break/in-app browse) that remain open on a separate track if the founder wants them next.

## 7 · Self-assessment (5 lines)

This slice touches nine files' worth of money/PII display surface, so I treated the money-lock
checklist as load-bearing rather than a formality: the `git diff -- lib modules` empty-check, the
`vh-gold-num`-on-light-background bug I caught and fixed twice during self-review, and the
DR-043/payoutsOpen conditional I corrected before commit are the three places a re-skin like this
most plausibly goes wrong, and I verified each one explicitly rather than assuming the pattern held.
Live verification covered every honest-zero/pending state this dev DB could exercise (eligibility
fork, all money-pending screens, masking, mobile overflow); the two states it couldn't reach
(non-zero wallet, submitted KYC) I verified by reading the gating code line-by-line instead of
skipping the claim. Per the directive this goes to an independent Tier-A reviewer before any merge —
I have not and will not self-authorize.

**PARKED on `gps-rollout-earn` — awaiting INDEPENDENT Tier-A review (Fable/fresh session) + explicit
merge authorization. NO merge.**
