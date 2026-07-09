# Review Packet — Phase A: Auth + Referral-Gated Registration Rework (Tier A)

**Branch:** `gps-phasea-auth-referral` (cut from up-to-date `main` @ `241a947`)
**Spec:** `docs/specs/PhaseA_Auth_Referral_Rework_v1.0.md` (FROZEN) — implements **DR-036 + DR-038**, supersedes **DR-030**, preserves **DR-023 / DR-024**.
**Status:** PARKED — **do not merge.** Awaiting Fable Tier-A PASS + founder-relayed Opus merge authorization (GATE).
**Diff:** `docs/review-packets/gps-phasea-auth-referral.diff` (30 files, +1804/−206; excludes the spec file).
**For Fable:** review THIS packet + the `.diff` — not the repository.

---

## 1. What was built (mapped to the spec)

| Spec | Delivered | Key files |
|---|---|---|
| §3 Data model | **No migration needed** — password lives in Supabase (DR-024); `referredById` stays nullable (legacy grandfathered); eligibility derived. RLS untouched. | — |
| §4.1 Register (standalone) | Referral code MANDATORY (from `?ref` or field) → validate → sponsor → mobile+password(+name) → OTP → Supabase phone+password user → `User` w/ `referredById=sponsor` → single post-auth redirect. | `app/register/{page,register-form,actions}.tsx`, `lib/auth/{sponsor,password}.ts` |
| §4.2 Register (checkout) | Mandatory code enforced **before** OTP send + before order placement; password deferred to `/onboarding`. **Money/webhook/ledger path untouched.** | `app/checkout/{actions,checkout-form,page}.tsx` |
| §4.3 Login + reset | Primary mobile+password; OTP alternative sign-in; OTP-based password reset (no email link). Rate-limited. | `app/login/{login-form,actions}.tsx`, `lib/auth/{password,login-rate-limit}.ts` |
| §4.4 No-code state | "Invite-only" panel w/ WhatsApp + email CTAs (LAUNCH_CONFIG). | `app/register/register-form.tsx`, `lib/config/contact.ts` |
| §4.5 Broken-flow fix | Single post-auth redirect helper (`welcomeSeenAt==null → /welcome else /dashboard`, + safe-`next` open-redirect guard) applied after register-verify, password login, OTP login, reset. `?ref` preserved through header nav via first-touch cookie fallback on `/register`. | `lib/auth/post-auth.ts` |
| §DR-038 earning gate | `hasConfirmedPurchase(userId)` adapter + pure `canEarnCommission` rule + **documented Phase-B enforcement hook** at `CREDIT_COMMISSIONS`. Not enforced yet (per spec: "full enforcement is Phase B"). | `lib/affiliate/eligibility.ts`, `modules/affiliate/eligibility.ts`, `lib/payments/webhook.ts` |
| §6 Security | Password min 8 (configurable, floored); OTP-send throttle reused; new login-attempt throttle (per-phone/IP backoff); generic errors (no enumeration); staging OTP bypass preserved. | `lib/auth/{password,login-rate-limit,otp-rate-limit}.ts` |

## 2. §8 Acceptance tests — results

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | Register without code → blocked | ✅ | `tests/register-actions.test.ts` §8.1 (Zod blocks before any lookup / OTP) |
| 2 | Invalid code → generic block | ✅ | `tests/register-actions.test.ts` §8.2 + read-only e2e (`?ref=GSDOESNOTEXIST` stays on gate) |
| 3 | Valid code → account, `referredById=sponsor`, `referralCode` gen → welcome | ✅ | `tests/register-actions.test.ts` §8.3 + `tests/referral-sponsor.test.ts` + `user-sync.integration` |
| 4 | Login (password) → dashboard; first-time → welcome | ✅ | `tests/login-actions.test.ts` §8.4 + `tests/post-auth-redirect.test.ts` |
| 5 | Password reset via OTP works | ✅ | `tests/login-actions.test.ts` §8.5 |
| 6 | Checkout completes (DR-023) w/ mandatory code, webhook/ledger unchanged — non-regression | ✅ | `tests/checkout-referral-gate.test.ts` + **unchanged** `checkout-mock.integration` + `money-flow.integration` all green |
| 7 | Get-Started→…→dashboard e2e green | ⚠️ **Partial** | `e2e/auth-surfaces.spec.ts` (read-only, runs now) authored; `e2e/auth-journey.spec.ts` (full write journey) authored but **gated to staging** (needs `E2E_JOURNEY_REF` + staging OTP bypass) — see Deviations. |
| 8 | Staging bypass (`123456`) works on register/login/checkout | ✅ | All 3 surfaces route through `getOtpProvider()`; unchanged `tests/otp-staging.test.ts` green. |
| 9 | Sponsor w/ no confirmed purchase earns no commission | ✅ | `tests/earning-eligibility.test.ts` §8.9 (pure rule + DB adapter: `CREATED` order ≠ eligible; `PAID` ⇒ eligible) |
| 10 | Full suite green; tsc/lint/prettier clean | ✅ | **334/334 tests · 47 files** · `tsc` clean · eslint 0 errors (4 pre-existing warnings, untouched files) · prettier clean (my files) |

## 3. Full test run

```
Test Files  47 passed (47)
     Tests  334 passed (334)
  Duration  34.54s
```
Includes unchanged money-path integration suites (`checkout-mock`, `money-flow`, `withdrawal-payout`, `hold-clawback`) — **non-regression confirmed**. New: `register-actions` (7), `login-actions` (7), `checkout-referral-gate` (4), `earning-eligibility` (3), `referral-sponsor` (3), `password-policy` (4), `login-rate-limit` (4), `post-auth-redirect` (4).

## 4. Security review (Tier-A §6)

- **No enumeration:** referral-code miss, wrong password, and bad OTP all return one generic message; sponsor resolution never signals which codes exist.
- **Passwords:** Supabase-hashed (DR-024 — no `passwordHash` column); never logged; min 8 (floored, `MIN_PASSWORD_LENGTH`-configurable); set via `updateUser` on the post-OTP session.
- **Rate-limiting:** OTP send (per-phone 4 / per-IP 8, existing) + new login-attempt backoff (per-phone 5 / per-IP 20, 10-min window). Referral gate rejects **before** any SMS send (removes an OTP-spend abuse vector).
- **Open-redirect:** `safeNext` rejects `//host` and absolute URLs; only root-relative paths honoured.
- **Staging:** `isStagingMode()` OTP bypass unaffected on all three surfaces; prod domain still hard-guarded (unchanged `providers.ts`).
- **Boundaries:** every action Zod-validated; server re-validates the mandatory code at both send and verify (defence in depth).

## 5. Self-assessment (5 lines)

1. **Additive & money-safe:** zero schema migration, zero change to `lib/payments/{webhook,checkout}` logic or `modules/affiliate/{upline,credit,commission}` — the only webhook edit is a comment (Phase-B hook); all money integration tests pass unchanged.
2. **Spec-faithful:** referral gate is mandatory and server-enforced at every step; DR-038 earning rule is **locked + tested** but intentionally **not enforced** (spec defers to Phase B) to preserve non-regression.
3. **The founder's headline bug is fixed:** login no longer dead-ends on "You're signed in ✓" — a single `postAuthRedirect` drives welcome/dashboard everywhere.
4. **Honest gaps:** the full write-journey e2e is gated to staging (can't run here without SMS/staging build); screenshot capture timed out in this env (surfaces DOM-verified instead) — both documented below, neither is a code defect.
5. **Truthful config:** contact channels + copy are real, clearly-non-final LAUNCH_CONFIG slots (#42–#44); no fabricated data (D-29).

## 6. Deviations & honest notes

- **No DB migration** (spec §3 allowed but did not require one): `referredById` mandatory is **app-enforced** at register (DB stays nullable so legacy/staging testers aren't orphaned — spec §7). `affiliateEligibleAt` column skipped (spec: "only if perf needs it"; a `count` on `Order` is cheap). This is the lowest-risk reading of §3.
- **DR-038 enforcement is a documented hook, not active** (`lib/payments/webhook.ts` `CREDIT_COMMISSIONS`). Spec §3/§8.9: "full enforcement is Phase B; the rule is locked here." Enforcing now would break the intended non-regression (uplines without purchases are still credited in Phase A). The rule + adapter + tests are in place; Phase B flips it on.
- **§8.7 e2e is partial in this environment:** the read-only surface spec runs now; the full register→welcome→dashboard write-journey (`e2e/auth-journey.spec.ts`) requires a staging deploy with the OTP bypass + a real sponsor code (`E2E_JOURNEY_REF`) and is skipped by default (respects the repo rule against un-cleanable writes to the shared Supabase). **Recommend running it once on `test.goskilled.in` before merge.**
- **Screenshots:** `preview_screenshot` timed out repeatedly (renderer-capture issue, no console errors); surfaces were verified via DOM inspection instead — register gate + no-code WhatsApp/email panel, login password + OTP + reset toggle, and invalid-`?ref` staying on the gate all confirmed rendering.
- **`?ref` on CTAs:** rather than thread `?ref` through every CTA, `/register` falls back to the first-touch `gs_ref` cookie (set by middleware on any page). This preserves attribution through header navigation that drops the query — a more robust fix than per-CTA query-carrying, and consistent with the existing DR-030 cookie design.

## 7. Tier-A merge checklist

- [x] `npm run typecheck` clean
- [x] All tests green (334/334) — money paths unchanged & passing
- [x] Architecture: adapters thin; no money rule re-implemented; DR-038 hook documented not duplicated
- [x] Security: no secrets in code; Zod boundaries; generic errors; signature-before-parse untouched; staging guard intact
- [x] Performance: eligibility = single `count`; no new N+1; sponsor lookup is a unique-index hit
- [x] No Blueprint/Constitution/Decision-Register conflict (DR-036/DR-038 authority restated in-spec §2)
- [x] Docs updated (LAUNCH_CONFIG #42–#44; spec landed)
- [x] Commit created (`75c1e91`) — **parked, not merged**
- [ ] **Fable Tier-A PASS** — pending
- [ ] **Founder-relayed Opus merge authorization (GATE)** — pending
