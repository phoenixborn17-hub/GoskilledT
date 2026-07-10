# Review Packet — Phase C: KYC Expansion + Withdraw Flow (Tier-A · money + PII · Fable)

**Branch:** `gps-phasec-kyc-withdraw` (off `main` @ `9704092`, Phase A+B included)
**Spec:** `docs/specs/PhaseC_KYC_Withdraw_v1.0.md` (FROZEN) — DR-037/D-01 · DR-025 · DR-001.
**Status:** PARKED — **do not merge.** Awaiting Fable Tier-A PASS + founder-relayed Opus authorization (GATE).
**Diff:** `docs/review-packets/gps-phasec-kyc-withdraw.diff` (29 files). Migration `20260710120000_kyc_phasec_expansion` (additive, applied to the shared DB).
**For Fable:** review THIS packet + the `.diff` — not the repository.

## 0. The one hard rule (held)
**No real money leaves the system.** No disbursement provider was added. The internal PAYOUT ledger tx is now **hard-gated behind `payoutsEnabled` at the mark-paid site** — with the flag OFF (default, pre-D-01), Mark PAID is refused and **zero** ledger movement occurs (proven by test).

## 1. What changed

### C1 — KYC expansion (PII)
- **Schema (additive migration):** `Kyc` gains `email`, `emailVerifiedAt`, `whatsappVerifiedAt`, `bankName`, `docType`, and **encrypted** doc-object paths `addressDocEnc`/`panDocEnc`/`bankDocEnc`; new `ContactVerification` table (RLS **enabled**, deny-all). All nullable / non-breaking.
- **Encryption:** PAN + account + **doc paths** → AES-256-GCM (`lib/pii`); display masked (`maskLast4`); admin reveal logged (existing `KYC_VIEWED` + new `KYC_DOC_VIEWED`). Raw PII never logged.
- **Uploads:** private Supabase Storage bucket `kyc-docs` (`public:false`, created on first use); the DB stores only the **encrypted** object path. Access is owner-or-admin only, via short-lived signed URLs — routes `app/dashboard/earn/kyc/doc/[kind]` (self, 401 if unauth) and `app/admin/kyc/[userId]/doc/[kind]` (admin, **403 if not admin**, reveal-logged). No public URLs.
- **Verify flow:** email/WhatsApp OTP → `emailVerifiedAt`/`whatsappVerifiedAt` set **only** on a correct, unexpired, unconsumed code (single-use). Only a SHA-256 hash of the code is stored. Send provider is `KYC_VERIFY_PROVIDER` (LAUNCH_CONFIG; `console` default no-op, `live` throws until wired).
- **Admin review:** new fields + verify tags + per-doc reveal links; `KYC_APPROVED` continues to gate withdrawal.

### C2 — Withdraw flow
- **Rules (all already server-enforced by `validateWithdrawal`, unchanged):** min ₹500 / max ₹25,000 · KYC APPROVED · available (not held) balance (DR-025) · single-pending · `payoutsEnabled`.
- **Lifecycle:** added **Applied → In Progress → Paid** (`markWithdrawalInProgress` + `canMarkWithdrawalInProgress`; no money moves at In-Progress) + Rejected + History (user wallet history now renders "in progress").
- **D-01 gate at the money-move site:** `canMarkWithdrawalPaid` now takes `payoutsEnabled`; `markWithdrawalPaid` passes `payoutsEnabled()`. OFF ⇒ refused, no PAYOUT tx.
- **Untouched:** `buildPayoutTxSpec`, idempotency key (`payout:{id}`), balance recompute, clawback, DR-007 amounts.

## 2. §6 Acceptance tests — results (all green)
| # | Acceptance | Result | Evidence |
|---|---|---|---|
| KYC-1 | save encrypts PAN/account (ciphertext stored, masked shown) | ✅ | `kyc-phasec.integration` (column is `iv:tag:ct`, view is `•••• 234F`) |
| KYC-2 | email/WhatsApp flags set ONLY on verify | ✅ | `kyc-phasec.integration` (wrong code → false; correct → true; replay → false) |
| KYC-3 | uploaded docs private; unauthorized fetch 403 | ✅ | `kyc-doc-route` (admin route 403 non-admin; owner route 401 unauth) + `kyc-storage` (`canAccessKycDoc`) |
| KYC-4 | admin reveal logged | ✅ | existing `revealKyc`→`KYC_VIEWED`; doc route→`KYC_DOC_VIEWED` (audit carries no PII) |
| KYC-5 | non-APPROVED KYC blocks withdrawal | ✅ | `kyc-phasec.integration` (`KYC_REQUIRED`) |
| WD-1 | <₹500 / >₹25k rejected server-side | ✅ | existing `validateWithdrawal` (`affiliate-domain`) |
| WD-2 | blocked when KYC/available/pending/payouts fail | ✅ | `validateWithdrawal` codes |
| WD-3 | lifecycle Applied→In-Progress→Paid + History | ✅ | `admin-domain` (`canMarkWithdrawalInProgress`) + `withdrawal-payout.integration` |
| WD-4 | **payoutsEnabled OFF ⇒ no real payout executes** | ✅ | `withdrawal-payout.integration` (OFF ⇒ refused, 0 ledger tx, row stays APPLIED) + `admin-domain` (`PAYOUTS_DISABLED` first) |
| WD-5 | ledger idempotency/amounts unchanged (non-regression) | ✅ | `withdrawal-payout` + `money-flow` + `checkout-mock` all green |
| — | full suite green; tsc/lint/prettier clean | ✅ | below |

## 3. Full test run
```
Test Files  56 passed (56)
     Tests  387 passed (387)
```
`tsc` clean · eslint 0 errors (4 pre-existing warnings, untouched files) · prettier clean.
Fixture change (spec-aligned, non-regression): `withdrawal-payout.integration` now sets `AFFILIATE_PAYOUTS_ENABLED=true` in `beforeAll` (restored after) because it EXERCISES the payout path, which is now correctly gated; the OFF case is a new dedicated test. All original assertions unchanged.

## 4. Security review (Tier-A §5)
- **PII at rest:** PAN, account, and doc paths encrypted (AES-256-GCM); shown masked; decrypt failures return a safe error (never partial PII); audit rows carry no PII.
- **Uploads private:** bucket `public:false`; access only via server-authorized short-lived signed URLs; owner-or-admin rule enforced at the route (401/403) and unit-tested; direct bucket access without a signed URL is denied by Supabase.
- **Reveal logged:** admin PII reveal (`KYC_VIEWED`) and admin doc access (`KYC_DOC_VIEWED`) both write audit rows.
- **Withdrawal:** every rule server-enforced in the domain; the D-01 flag is re-checked at the money-move site (defence in depth); balance recomputed from the ledger at mark-time.
- **Ledger untouched:** idempotency, clawback, amounts unchanged — non-regression suites green.
- **Staging OTP bypass:** unaffected (no auth path changed). RLS enabled on the new table.

## 5. Open points flagged for founder (§7 — NOT guessed)
1. **Withdrawal application window:** built **anytime** (default) with a **Monday** processing cycle (DR-001). Confirm anytime vs Monday-only. (LC #50)
2. **Email/WhatsApp verify provider:** flow + flag built; delivery service is `KYC_VERIFY_PROVIDER` (LAUNCH_CONFIG). **UPI** kept optional (default). (LC #47)
3. **Address-proof document-type list:** placeholder Aadhaar/DL/Voter/Passport — confirm the final list. (LC #49)

## 6. Self-assessment (5 lines)
1. **Money stays put:** no disbursement provider; the D-01 OFF gate is enforced at the exact money-move site and proven (OFF ⇒ 0 ledger tx, row untouched).
2. **PII is encrypted, masked, reveal-logged, and access-controlled** — including document paths and the private bucket; the 403/401 rule is unit-tested and enforced server-side.
3. **Additive & non-regression:** nullable columns + one RLS-enabled table; the ledger/idempotency/clawback/amounts are untouched and all money suites pass.
4. **Scope held:** request/queue/lifecycle only — no real payout, no Phase D/E surfaces; the three §7 questions are flagged, not decided.
5. **Honest gaps:** auth-gated dashboard/admin pages verified via typecheck + integration tests of their adapters (no preview login session); the live bucket round-trip needs the Supabase `kyc-docs` bucket provisioned (LC #48) — the pure/authorization logic is tested, the actual upload is ready.

## 7. Deviations & notes
- **Doc paths encrypted** (not just the files) per §3 "any doc references → encrypted" — belt-and-suspenders if the DB leaks.
- **Verify flow uses a `ContactVerification` table** (hash-only) rather than an in-memory store — persistent + testable; provider delivery is config-gated.
- **Commission-structure/other pages** unchanged; C2 reused the existing `validateWithdrawal` rule set verbatim (min/max/KYC/available/pending/payouts were already implemented in Phase-earlier work).
- **Live upload not exercised in CI** (needs the private bucket on the shared Supabase); authorization + 403/401 + encryption are covered.

## 8. Tier-A merge checklist
- [x] `tsc` clean · all tests green (money paths never skipped)
- [x] Adapters thin; domain rules own every decision; ledger untouched
- [x] Security: PII encrypted/masked/reveal-logged; uploads private + authorized (403/401); no PII in logs; RLS on new table
- [x] D-01: payoutsEnabled OFF ⇒ no payout executes (enforced + tested)
- [x] Additive migration only; RLS enabled; applied to DB
- [x] Docs updated (LAUNCH_CONFIG #47–#50); §7 open points flagged
- [x] Commit `e05b38c` — **parked, not merged**
- [ ] **Fable Tier-A PASS** — pending · [ ] **Founder-relayed Opus authorization (GATE)** — pending
