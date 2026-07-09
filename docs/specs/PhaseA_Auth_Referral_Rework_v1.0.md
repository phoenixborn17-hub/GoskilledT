# Phase A — Auth + Referral-Gated Registration Rework — Module Spec v1.0 (FROZEN)

> **In-repo build spec (self-contained).** Governance source: `Genesis/04_GPS/Module_Specs/PhaseA_Auth_Referral_Rework_v1.0.md` + Decision Register **DR-036 / DR-038** (restated inline in §2 so this repo spec needs no external file). **Status: FROZEN for build (2026-07-09).** Tier: **A** (Fable reviews the build packet — auth/security + reverses a locked decision). Builder: Claude Code. **Do not merge — park + produce a Tier-A Review Packet; `main` is touched only on the founder's relayed merge authorization (GATE).**

## 0. Why DR-036/DR-038 aren't yet in the repo
This spec + its decisions were frozen in the Genesis governance layer (a sibling folder outside this repo's root), so a repo grep won't find `DR-036`/`DR-038` yet — that's expected, not a missing dependency. Everything needed to build is restated below. Landing this file (and the code) is what brings those references into the repo.

## 1. Goal (what "done" means)
A person can register ONLY with a **valid referral code**, using **mobile + password + OTP**; a code-less visitor gets a clear "contact us for a code" path; returning users log in with **password (+ OTP recovery)**; and the **Get-Started → login → welcome → dashboard** journey works end-to-end with zero dead ends. Earning eligibility is wired to **the affiliate's own purchase**. No money path (DR-023 checkout) regresses; the staging OTP bypass still works.

## 2. Decisions this enforces (restated for the repo)
- **DR-036 — Auth model.** Registration + login = mobile + **password** + OTP; **referral code MANDATORY** to register (invite-only). Supabase Auth stays the single identity authority (now phone+password); no hand-rolled auth; `AdminUser.passwordHash` stays removed. Supersedes the old DR-030 (open, no-password registration); preserves DR-023 (checkout OTP path) + adds the referral gate; amends DR-024 (Supabase gains phone+password).
- **DR-038 — Registration model + earning gate.** **Model 1:** referral-code-gated registration works standalone (`/register`) AND inside checkout (DR-023); code mandatory in both. Free accounts allowed (browse / webinar / free previews). **Earning eligibility requires the affiliate's OWN confirmed purchase** — a referral link or registration alone NEVER earns. Affiliate label/privacy defaults in §5.

## 3. Data model (Prisma; additive/safe only)
- **Password lives in Supabase Auth**, not our tables — enable phone+password on the Supabase project. No `passwordHash` column in our schema (DR-024 preserved).
- `User.referralCode` — unique, auto-generated (already exists). Keep.
- `User.referredById` — **sponsor**; **REQUIRED for all NEW registrations** (was optional). Legacy/pre-existing users stay nullable (grandfathered — §7). Upline L2/L3 derived by walking `referredById` (no denormalized columns; matches the built commission engine).
- **Earning eligibility = derived:** `hasConfirmedPurchase(userId)` = ≥1 `Purchase` in a paid/confirmed state. No new column required; expose as a helper the commission engine consumes (full enforcement is Phase B; the rule is locked here). Optional additive `User.affiliateEligibleAt` (nullable) only if perf needs it.
- Migration additive only (no drops). RLS unchanged.

## 4. Flows

### 4.1 Registration — standalone (`/register`)
1. **Code required first.** Read code from `?ref=CODE` (referral link) or a manual "Referral code" field. Empty/absent → show the **no-code state** (§4.4), block the form.
2. **Validate code** server-side → resolve sponsor `User`. Invalid → generic error "Enter a valid referral code" (never reveal which codes exist) + no-code CTA. Valid → show the form (optionally show sponsor first name: "Invited by Rahul").
3. **Collect:** mobile (10-digit IN), password (policy §6), name (optional). → **Send OTP** (Supabase phone; staging → bypass code `123456`).
4. **Verify OTP** → create Supabase auth user (phone + password, phone_confirmed) → get-or-create our `User` with `referredById = sponsor.id`, auto-generate `referralCode`, first-touch attribution preserved.
5. **Redirect:** `welcomeSeenAt == null` → `/welcome` → Lesson 0 → Dashboard Hub (the flow-fix, §4.5).

### 4.2 Registration — inside checkout (DR-023, money path — keep minimal)
Checkout keeps phone→OTP→pay, **plus**: capture referral code (from `?ref` or a field) and **enforce it as mandatory before payment**; set/collect password here OR defer to `/onboarding` to keep the Razorpay step stable. Account created as today (by-product of purchase) with `referredById` set. **Do not otherwise alter payment/webhook logic.**

### 4.3 Login (`/login`) + password reset
- Primary: **mobile + password** → success → redirect per §4.5.
- **OTP path:** offered as an alternative sign-in AND as **password reset** (no forgot-password email — phone is the identity): mobile → OTP → set new password.
- Rate-limit login attempts + OTP sends (§6).

### 4.4 No-code state ("Contact company for a code")
Clear screen: "GoSkilled is invite-only. Get a referral code from whoever invited you, or contact us." CTAs: **WhatsApp** deep-link + **email** + optional "Request a code" form. Contact values = `LAUNCH_CONFIG` rows (Layer-2, founder-final).

### 4.5 Broken-flow fix (founder's headline bug)
- **"Get Started" / pre-login CTAs** route to `/register` (carry `?ref` if present) — no dead link.
- **Post-auth redirect** (single source of truth): `welcomeSeenAt == null` → `/welcome`; else `/dashboard`. Apply identically after register-verify, login, and checkout-onboarding completion.
- Add an **e2e journey test** (real browser): Get-Started → register(valid code) → OTP → welcome → Lesson 0 → dashboard; and login → dashboard.

## 5. Affiliate label + privacy defaults (Layer-2 copy; DR-038)
Team → "My Network / Referrals"; keep "Level 1/2/3" + "Rewards"; tiers Contributor→Mentor→Community Champion; leaderboard ranks by completed-learners/contribution (not earnings/team-size). **Referral tables (Phase B; noted for consistency): only Level 1 exportable to sheet (CSV/XLSX); Level 2 & 3 members render WITHOUT mobile numbers and are non-exportable.**

## 6. Security (Tier-A checklist)
- Password policy: min 8 chars (configurable); Supabase hashes/stores; never log passwords.
- **Rate-limit** OTP send (per phone + IP) and login attempts (lockout/backoff) — required before LC #21 live.
- Referral-code + phone validation: generic errors, no user-enumeration.
- **Staging must keep working:** `isStagingMode()` OTP bypass (any phone + `STAGING_OTP_CODE`) unaffected on register/login/checkout; real prod stays hard-guarded.
- Sessions/cookies via the Supabase server client exactly as today; RBAC unchanged.

## 7. Migration / existing accounts
- Additive migration only. **New registrations: `referredById` required; legacy users grandfathered** (nullable — do not orphan existing staging testers).
- Existing staging users (OTP-bypass, no password) → let them set a password via the reset path; don't force-break sessions.
- If a house/root sponsor is needed for legacy/founder-seeded accounts, use a designated system user (document its id) — no fabricated referral chains (D-29).

## 8. Acceptance tests (must pass)
1. Register without code → blocked. 2. Invalid code → generic block. 3. Valid code → account created, `referredById = sponsor`, `referralCode` generated → welcome → dashboard. 4. Login (password) → dashboard; first-time → welcome. 5. Password reset via OTP works. 6. Checkout still completes (DR-023) with mandatory code, webhook/ledger unchanged — **non-regression**. 7. Get-Started→…→dashboard e2e green. 8. Staging bypass (`123456`) works on register/login/checkout. 9. Earning gate (cross-ref Phase B): a sponsor with no confirmed purchase earns **no** commission on a downline purchase (unit test / documented hook). 10. Full existing suite green; tsc/lint/prettier clean.

## 9. Out of scope (later phases)
Dashboard graphs, referral tables/export UI, KYC expansion, leaderboard/rewards, admin changes → Phases B–E. Phase A delivers only the auth/registration/flow foundation + the earning-gate rule + the data the tree needs.

---
### Change log
- v1.0 — 2026-07-09 (Opus, steward) — frozen from GoSkilled Full-Functional Spec v2 Phase A + DR-036/DR-038; in-repo build spec.
