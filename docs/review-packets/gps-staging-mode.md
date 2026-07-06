# Review Packet — Staging Mode (money/auth safety rail)

**Branch:** `gps-staging-mode` (cut from up-to-date `main` @ `15ec72b`)
**Tier:** **A — MANDATORY review** (touches the production provider safety rail: payments · OTP · video)
**Diff:** [`gps-staging-mode.diff`](gps-staging-mode.diff) · 7 files, +270 / −5
**Status:** ⏸️ PARKED — awaiting Opus Tier-A review + explicit merge authorization (GATE). **Not merged.**

> **Tier A — needs Fable/Opus review.** Files: `lib/config/providers.ts`, `lib/env.ts`,
> `components/system/staging-banner.tsx`, `app/layout.tsx`, `.env.example`,
> `tests/providers-staging.test.ts`, `tests/env.test.ts`.

---

## Goal

Let `test.goskilled.in` boot a **production build** with mock providers so the whole app runs
end-to-end with **no real money, no real SMS, no real video** — without ever weakening the guard that
protects the real production domain. One new env var (`APP_ENV`) + a persistent banner. No other
behaviour changes.

## The safety model (money rail — read this first)

The existing rail: `assertProductionProviderSafety()` hard-throws at boot (and inside every provider
getter) if `NODE_ENV=production` and any of payment/OTP/video is a mock. Staging adds **one tightly
scoped, fail-closed escape hatch**:

```
isStagingMode() ⇔  NODE_ENV === "production"
              AND  APP_ENV === "staging"
              AND  host(NEXT_PUBLIC_APP_URL) is parseable AND NOT in {goskilled.in, www.goskilled.in}
```

- **No flag → byte-for-byte the old behaviour.** `APP_ENV` unset ⇒ `isStagingMode()` false ⇒ strict throw, exactly as today.
- **HARD RULE — prod domain never stages.** `APP_ENV=staging` on `goskilled.in`/`www.goskilled.in` ⇒ `isStagingMode()` false ⇒ **still hard-throws.** You can never simulate money on the prod domain.
- **Fail-closed on unknown host.** Unset/unparseable `NEXT_PUBLIC_APP_URL` ⇒ not a *proven* non-prod host ⇒ **strict throw** (staging must positively prove it's non-prod).
- **When staging IS active:** the guard **warns loudly (once)** with the offending providers + host and boots. Payment provider resolves to `mockPaymentProvider` — no Razorpay path.
- **Analytics / email / AI unchanged** — still soft-warn (they were never money-unsafe).
- **`lib/env.ts` is NOT the money rail** — it only requires *secrets* when a *real* provider is selected, which staging never does. So it needs no relaxation; I only registered `APP_ENV` as a validated enum (typo protection + documentation). Prod-only security keys (`PII_ENCRYPTION_KEY`, `EMAIL_UNSUBSCRIBE_SECRET`) remain required in staging by design — they are not money-mocks, and staging should still encrypt PII.

## Banner

`components/system/staging-banner.tsx` — **server component**, rendered at the top of `<body>` in the
root layout. Reads server-only `APP_ENV` at render, so it ships in the **first server-rendered HTML**
(present from first paint → **zero CLS**, verified below). `showStagingBanner()` gates on
`APP_ENV=staging` AND a non-prod host, so it can **never** render on the prod domain (belt-and-
suspenders with the boot guard, which hard-throws a staging-flagged prod deploy anyway). Charcoal fill
+ off-white text (AA, unmistakable; no gold-on-light — Golden Rule 14).

## Scope discipline

No new features/pages/logic beyond the `APP_ENV` switch + banner. No schema/migration. The guard's
call sites (import-time, `getPaymentProvider`, `otpProvider`, `videoProvider`) are all covered by the
single central change — no adapter re-implements the rule.

---

## Verification

**Gates:**
- `npm run typecheck` — clean.
- `npx vitest run` — **38 files / 290 tests** pass (was 280; +9 staging, +1 `APP_ENV` enum).
- `eslint` on all changed files — clean.
- `prettier` — all changed code files clean (`.env.example` isn't a Prettier-parsed type).

**Mandatory test matrix** (`tests/providers-staging.test.ts`, all green):

| # | Scenario | Expectation | ✓ |
|---|---|---|---|
| 1 | prod + mock + **no flag** | hard-throws (unchanged strict) | ✓ |
| 2 | prod + `APP_ENV=staging` + non-prod host + mock | **warns loudly and boots** | ✓ |
| 3 | `APP_ENV=staging` + **prod host** (`goskilled.in`) | **still hard-throws** | ✓ |
| 3b | `APP_ENV=staging` + `www.goskilled.in` | still hard-throws | ✓ |
| 4 | fail-closed: staging flag + **host unset** | not staging → throws | ✓ |
| 4b | fail-closed: staging flag + **unparseable host** | not staging → throws | ✓ |
| 5 | dev (`NODE_ENV≠production`) | unchanged: mocks boot, no staging, no banner | ✓ |
| 6 | **no real-money path** in staging | `getPaymentProvider()` is `mockPaymentProvider` (never Razorpay) | ✓ |
| 7 | banner visibility | shown in canonical staging config, hidden without the flag / on prod host | ✓ |

**Banner SSR / CLS** — booted `APP_ENV=staging NEXT_PUBLIC_APP_URL=http://localhost:3007 next dev`,
`curl /` returned the banner **in the raw server HTML at the top of `<body>`** (before content), not
client-injected:
```html
<body class="min-h-dvh …"><div hidden>…</div><div role="status" class="w-full border-b border-gold/40
bg-charcoal px-3 py-1.5 text-center text-xs font-semibold text-offwhite"><span aria-hidden>⚠ </span>
STAGING — simulated: payments, OTP, emails are NOT real</div>…
```
Present in first paint ⇒ no post-load shift ⇒ CLS 0. (No-flag → banner absent is unit-covered, test 7.)

---

## Tier-A merge checklist

- [x] `npm run typecheck` clean
- [x] ALL tests green — 290/290 (money paths never skipped; new staging matrix added)
- [x] Architecture: single central guard change; adapters/getters unchanged, no rule re-implemented
- [x] Security: fail-closed staging gate; prod domain can never stage; no secrets in code; `APP_ENV` Zod-validated; prod security keys still required in staging
- [x] Performance: banner is static SSR (zero CLS, no client JS); guard is O(1) env reads
- [x] No Blueprint / Constitution / Decision-Register conflict (Golden Rule 2 preserved: no self-serve/real-money path in staging)
- [x] Docs updated (`.env.example` documents `APP_ENV` + the hard rule)
- [ ] **Git commit** — created on parked branch; **merge withheld pending authorization (GATE)**

## Self-assessment (5 lines)

1. **Correctness** — Every branch of the switch is pinned by a test, including the two that matter most for money: prod-domain-still-throws and staging-uses-the-mock-not-Razorpay.
2. **Safety posture** — Strictly *additive* and *fail-closed*: absence of a proven non-prod host defaults to the old strict throw; the prod domain has no path to mocks.
3. **Blast radius** — One central guard function + one env enum + one server banner; no getter/adapter/schema touched, so nothing downstream can drift from the rule.
4. **Residual risk** — Depends on `NEXT_PUBLIC_APP_URL` being set correctly on the staging host; if it's ever pointed at the apex, staging correctly refuses (throws) rather than silently staging on prod.
5. **Consistency** — Mirrors the existing `assertProductionProviderSafety`/`validateEnv` "throw-in-prod, warn-in-dev" philosophy and the soft-warn pattern; nothing here reads as a foreign style.

## Open question for reviewer

- `showStagingBanner()` is intentionally `NODE_ENV`-independent, so a local `APP_ENV=staging` preview
  also shows the banner (opt-in; default dev has no `APP_ENV` → no banner). Confirm that's desired, or
  restrict it to `NODE_ENV=production` only.
