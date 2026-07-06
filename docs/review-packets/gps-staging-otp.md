# Review Packet — Staging OTP Bypass (auth path)

**Branch:** `gps-staging-otp` (cut from up-to-date `main` @ `9d3c6ae`)
**Tier:** **A — MANDATORY review** (auth path: OTP verification + session minting via service_role)
**Diff:** [`gps-staging-otp.diff`](gps-staging-otp.diff) · 4 files, +362 / −1
**Status:** ⏸️ PARKED — awaiting Opus Tier-A review + explicit merge authorization (GATE). **Not merged.**

> **Tier A — needs Fable/Opus review.** Files: `lib/auth/otp.ts`, `lib/supabase/admin.ts`,
> `.env.example`, `tests/otp-staging.test.ts`.

---

## Goal

Let testers register / login / checkout on `test.goskilled.in` **without SMS**. Reuses the
`isStagingMode()` gate merged earlier, so the bypass is reachable **only** in staging and is provably
unreachable in real production and on the prod domain. No other behaviour changes.

## How it works

`getOtpProvider()` gains one branch, checked **after** `assertProductionProviderSafety()`:

```ts
if (isStagingMode()) return stagingOtpProvider();   // else → the existing real/test path, unchanged
```

`isStagingMode()` (from `lib/config/providers.ts`) = `NODE_ENV=production` **AND** `APP_ENV=staging`
**AND** a *proven* non-prod host. So:

- **`sendOtp(phone)`** → no-op success. No SMS, no Supabase send.
- **`verifyOtp(phone, token)`** → accepts the fixed `STAGING_OTP_CODE` (default `123456`) for **any**
  phone. On match: get-or-create the phone user (`phone_confirm: true`) via the **service-role Admin
  API**, then mint a **real Supabase session** and return the same `{ user }` shape as the live path
  (so cookies / RBAC / `syncUser` behave exactly as production). Wrong code → `throw` (generic
  "Invalid or expired OTP", never reveals the code) **before touching Supabase**.

## The safety-critical design choice — session minting

Supabase-js has no "admin mint session for user X" call, so the session is minted by:
**set a fresh random password on the user (Admin API) → `signInWithPassword` on the cookie-bound
client** (which sets the auth cookies, exactly like live `verifyOtp`).

The password is `randomBytes(24).toString("base64url")`, generated **per verify** and **immediately
discarded** — never stored, never logged, never returned. So **no reusable or guessable credential is
ever persisted**: even if password auth is enabled on the project, there is no known password to
replay. This is the key mitigation against a "known-password backdoor."

## Hard-safety guarantees (all test-pinned)

| Guarantee | Mechanism |
|---|---|
| Bypass runs ONLY in staging | single `isStagingMode()` branch |
| Real production untouched | `isStagingMode()` false when `APP_ENV≠staging` → real Supabase OTP path, unchanged |
| Prod domain never bypasses | `isStagingMode()` false on `goskilled.in`/`www` even with `APP_ENV=staging` |
| Mock providers can't sneak the bypass onto prod | `assertProductionProviderSafety()` still hard-throws first on the prod domain |
| Wrong code reveals nothing | generic error, no Supabase call |

## ⚠️ Deployment requirement (call out in review)

The bypass **writes auth users via `service_role`** (get-or-create, and rotates the password of an
existing user). **Staging MUST run against a NON-production Supabase project.** If staging shared the
prod project, staging would create/mutate real auth rows. GoSkilled users are OTP-only (no
self-serve password), so a rotated random password is functionally harmless even in that case — but
the correct, documented setup is a separate staging project. Documented in `.env.example`.
`SUPABASE_SERVICE_ROLE_KEY` is already required by the env schema.

## Scope discipline

One branch in `getOtpProvider()` + one focused `stagingOtpProvider()` + a small reusable service-role
client helper (`lib/supabase/admin.ts`) + one env var. No schema/migration, no route/action changes,
no change to the live or test OTP paths. `OtpProvider.name` presents as `"test"` (unused downstream)
to avoid rippling the provider-name union.

---

## Verification

**Gates:**
- `npm run typecheck` — clean.
- `npx vitest run` — **39 files / 298 tests** pass (was 290; +8 staging-OTP).
- `eslint` on changed files — clean · `prettier` — clean (`.env.example` isn't Prettier-parsed).

**Mandatory test matrix** (`tests/otp-staging.test.ts`, all green — Supabase boundaries mocked, no live project):

| # | Scenario | Expectation | ✓ |
|---|---|---|---|
| 1 | staging + **correct** code | get-or-creates user + mints session `{ user }`; real SMS-verify NOT called | ✓ |
| 2 | staging + **wrong** code | rejects; **no** admin client, **no** session | ✓ |
| 3 | staging + **existing** user | createUser errors → `listUsers` finds → `updateUserById` rotates pwd → session | ✓ |
| 4 | staging **sendOtp** | resolves no-op; no Supabase send | ✓ |
| 5 | `STAGING_OTP_CODE` override | old default `123456` rejected; new code accepted | ✓ |
| 6 | **REAL production** (live/razorpay/stream) | bypass never runs; fixed code `123456` hits **real** `verifyOtp({type:"sms"})`; no user created | ✓ |
| 7 | **prod host** + `APP_ENV=staging` + real providers | `isStagingMode()` false → real OTP; no user created | ✓ |
| 8 | prod host + `APP_ENV=staging` + mock providers | **hard-throws** (bypass unreachable on prod domain) | ✓ |

## Tier-A merge checklist

- [x] `npm run typecheck` clean
- [x] ALL tests green — 298/298 (auth path pinned; the 4 required cases + 4 more)
- [x] Architecture: one central branch; real/test OTP paths untouched; adapter thin (no rule re-implemented in actions)
- [x] Security: gated by `isStagingMode()` (unreachable in prod / on prod domain); service_role never client-exposed; fresh random password per verify (no persistent credential); wrong code leaks nothing; PII/OTP rules intact
- [x] Performance: no hot-path impact (staging-only); `listUsers` paging only on the rare existing-user create-collision
- [x] No Blueprint / Constitution / Decision-Register conflict (DR-024 one-auth-authority preserved — still Supabase Auth; Golden Rule 2 preserved — no real-money/self-serve path opened)
- [x] Docs updated (`.env.example` documents `STAGING_OTP_CODE` + separate-project requirement)
- [ ] **Git commit** — created on parked branch; **merge withheld pending authorization (GATE)**

## Self-assessment (5 lines)

1. **Correctness** — Both the happy path (create + existing-user) and the reject path are pinned; the two "prod can't reach this" cases are the load-bearing tests and both pass.
2. **Safety** — Reuses the already-reviewed `isStagingMode()` rail; strictly additive; fresh-random-password minting leaves no reusable credential; the prod domain hard-throws before the branch is even considered.
3. **Blast radius** — One branch + one helper; live/test OTP untouched, so nothing downstream can drift.
4. **Residual risk** — Depends on staging using a **separate Supabase project** (documented) and on Supabase phone+password sign-in being enabled for that project; if minting fails it errors cleanly rather than half-authenticating.
5. **Consistency** — Mirrors the existing provider-adapter shape and the `isStagingMode()` gating from the staging-mode merge; reads as the same codebase.

## Open questions for reviewer

1. **Session-mint mechanism** — password-bootstrap (fresh random pwd → `signInWithPassword`) is the
   version-stable way to mint a phone session in supabase-js v2. Acceptable, or prefer a different
   approach (e.g. a dedicated staging Supabase project with phone test-numbers only)?
2. **Existing-user password rotation** — get-or-create rotates an existing user's password to the
   transient random value. Harmless for our OTP-only users; confirm that's acceptable for staging.
