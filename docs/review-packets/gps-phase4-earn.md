# Review Packet — Phase 4: Earn Workspace (Redesign U5) · **Fable Tier-A (money/PII)**

- **Branch:** `gps-earn` (off `main` @ `faba950`) · **Commit:** `ebd3424`.
- **Tier:** **A — money/PII.** Needs **Fable Tier-A leak-hunt + steward** before merge. **GATE: PARKED — not merged. `main` untouched.**
- **Read:** Dashboard_Redesign_v3.0 §4 · IA v2.0 §5.3 · Amendments §C/§D · DecisionCard system · Nav_Workspace v1.1.

## The Tier-A claim: this is DISPLAY-ONLY

- **No money recompute, no re-gate.** Every money value comes straight from the existing leak-tested ledger helpers (`getWalletSummaryFor`, `getHeldCredits`, `getWalletHistory`, `hasPendingWithdrawal`, graph queries). `lib/earn/dashboard.ts` only **composes** these reads — it contains **zero** money arithmetic.
- **Withdraw gating byte-identical.** `canWithdraw = kycVerified && summary.availableInPaise > 0 && !pending` and its conditional branches are copied verbatim from the pre-reskin page (see the code comment marking it). `WithdrawForm` / `WalletSummary` / `HeldCreditRow` are **untouched**.
- **DR-038 masking untouched.** The Network page's L1-export / L2-L3-masked rendering + `getReferralNetwork` are unchanged (heading class only).
- **Payouts stay OFF (D-01).** No surface enables a payout; no fake "Paid".
- **Proof:** money non-regression **53/53 green** (below).

## What was re-skinned

**Earn dashboard** (`app/dashboard/earn/page.tsx` + `lib/earn/dashboard.ts`):

- **Eligibility-forked zero-state (Amendments §D)** — reads DR-038 `isEligibleToEarn`:
  - **A) not eligible** (no own confirmed purchase) → _"Step 1 — get your package · Earning unlocks with your purchase"_ → Store (`/packages`). **The share flow is NOT shown.**
  - **B) eligible, 0 referrals** → the share flow (getting-started + referral object).
  - **eligible + referrals** → full dashboard.
- **Referral object** — link · copy · QR · WhatsApp + the honest **commission RANGE "₹150–₹250 per referral"** → Commission Structure (a range, never a promise).
- **Needs-attention chips** — KYC ("get payout-ready") + payout status, real state only.
- **Stat cards** — Financial family (gold accent, **charcoal tabular numbers, NO count-up**), `safeMoney`/`safeCount` (never ₹0): **Available anchors only when > 0** (§D), **Held = 48h buyer-protection framing**, Total earned, Active friends (+this-month).
- **Always-visible honest payout-status line** ("earnings recorded & safe; payouts open soon — we'll notify you").
- **Rewards + Leaderboard entry cards** (built; reachable here, not in the sidebar per Nav v1.1).
- **Activity tab** — earnings + payments graphs (existing `MiniChart`, honest empty states).

**Wallet** (`app/dashboard/earn/wallet/page.tsx`) — **Register-2 CALM** (neutral surfaces + thin gold accents + charcoal tabular numbers):

- Always-visible payout-status line. **FLAG OFF** → honest "recorded & safe" + **notify-me** toggle, **no ₹** (LC #17). **FLAG ON** → the **Withdraw truth-surface** (form only when every rule met; else the honest reason — pending / **inline "Start KYC →"** gate / nothing-available) — logic preserved.

**My Network · Leads · Commission Structure** — heading-consistency touch-ups only; **DR-038 masking, leads upload/table, and commission tables preserved verbatim** (deliberate Tier-A prudence — I did not rewrite leak-tested PII rendering).

**Nav** — removed the redundant `EarnSubNav` (the shell's contextual sidebar is the single Earn nav post Nav_Workspace v1.1).

## Verification

```
tsc --noEmit → 0 · prettier → clean · eslint (changed) → 0/0
vitest --exclude integration → 373 passed
MONEY NON-REGRESSION → 53 passed across 9 files:
  money-flow · earning-gate-webhook · hold-clawback · refund-mirror · commission ·
  withdrawal-payout · withdrawal-rules · affiliate-domain · commission-structure
```

**Browser (next-dev, authenticated — non-eligible test account):** no console errors.

- **Earn** = `data-theme="earn"` (gold); **variant A** renders ("get your package"); **the "share to earn" flow is NOT leaked** to the non-eligible user (§D lock verified in the live DOM); no EarnSubNav.
- **Wallet** = payout-status line ("recorded…", "Payouts open soon") + **notify-me** toggle + **no ₹** + **no fake "Paid"** (flag OFF).

> **Screenshots note (honest):** the preview renderer got stuck after HMR churn (prettier rewriting watched files), same as Phase 3 — I verified via authoritative live-DOM `outerHTML` inspection instead (assertions above). The **rich** paths (full stat-card dashboard; flag-ON withdraw form) need a **seeded eligible/paid account** to eyeball — implemented + typechecked. Recommend Fable/steward run the leak-hunt on a seeded account.

## Fable Tier-A leak-hunt asks

1. Confirm **no money recomputation** anywhere in `lib/earn/dashboard.ts` or the pages (composition only).
2. Confirm the **withdraw gating** (`canWithdraw`) + branches are byte-identical to pre-reskin.
3. Confirm **DR-038** L1-export / L2-L3-mask is unchanged (Network page).
4. Confirm **§D eligibility fork** never shows share-to-earn to a non-eligible user (variant A), and **Available anchors only when > 0**.
5. Confirm **no fake "Paid"**, payouts stay OFF, `safeMoney` (never ₹0), no count-up on money.

## Notes / follow-ups (not blockers)

- **notify-me** is a client-side preference (localStorage) that honestly says "we'll message you when payouts open" — server persistence + the actual notification trigger are a tracked LAUNCH_CONFIG follow-up (the platform already notifies via existing channels).
- **QR** uses the honest placeholder renderer (the URL→matrix encoder is the same Phase-2 parked item, not faked).
- Register-2 calm is achieved via explicit tokens (`bg-surface-raised`, `text-ink`, thin `gold-400` accents), not by removing the workspace theme — Wallet stays visually calm regardless of the gold `[data-theme]`.

## Self-assessment

1. Display-only proven — composition over existing reads; withdraw/masking/money-component logic untouched; **53 money tests green**.
2. All §D money-honesty locks implemented + the critical one (no share-to-earn leak to non-eligible) verified live.
3. Wallet is Register-2 calm with the Withdraw truth-surface preserved (no fake Paid; inline KYC gate).
4. Tier-A prudence on Network/Leads/Commission — heading-only touch, leak-tested PII rendering preserved.
5. Parked for **Fable Tier-A + steward** — no merge sought; honest about the screenshot gap + seeded-account eyeball.
