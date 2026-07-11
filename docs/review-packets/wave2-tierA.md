# Review Packet — Wave 2 Tier-A fixes

**Branch:** `gps-tierA-w2` (cut from latest `main` @ `696d493`)
**Status:** PARKED — **no merge**. → Fable Tier-A review, then human-relayed merge authorization (GATE).
**Source of findings:** [docs/audit/PLATFORM_AUDIT_2026-07.md](../audit/PLATFORM_AUDIT_2026-07.md)
**Full unified diff:** [wave2-tierA.diff](./wave2-tierA.diff) (1,527 lines; `docs/audit/*` excluded)

## Green bar
| Gate | Result |
|------|--------|
| `npm run typecheck` (`tsc --noEmit`) | ✅ clean |
| `npm run lint` (eslint) | ✅ 0 errors (4 pre-existing warnings in untouched files: guru-panel, e2e/qa, scripts) |
| `prettier --check` (changed files) | ✅ all formatted |
| `npm run build` (`APP_ENV=staging`, mock providers) | ✅ compiled + types valid + page data collected; `/api/checkout` absent, `/terms` `/privacy` build static |
| Unit tests (`vitest run --exclude **/*.integration.test.ts`) | ✅ **396/396 passed** (51 files) |
| Live integration tests (`*.integration.test.ts`) | ⏳ NOT run here — see "Test scope" below |

**Test scope note.** The live `*.integration.test.ts` suite hits the shared Supabase DB and **requires the M-2/FV-1 migration (`20260712100000_gst_rate_zero_until_registered`) to be applied first** (it seeds the `earn` GLOBAL SHOW row that FV-1 depends on). This session did **not** run migrations against or mutate the shared DB. **Reviewer action:** apply the migration to the target DB, then run the full `npm test` (money paths never skipped) — especially `earning-gate-webhook`, `refund-mirror`, `withdrawal-payout`, `kyc-*`, and `feature-visibility-admin` integration tests. The `feature-visibility-admin` test was made robust to the new fail-closed default (models the launch GLOBAL SHOW explicitly).

---

## Fixes (per the founder directive)

### M-1 · Receipt "(GST-inclusive)" removed · S1 · legal
- **What changed:** `lib/email/receipt.ts` — both text (`:53`) and HTML (`:67`) now read `Amount paid: ₹X — no hidden charges` (was `(GST-inclusive)`). Added a compliance guard comment at the top of the file.
- **Key files:** `lib/email/receipt.ts`, `tests/email.test.ts`.
- **Risk:** none to money math (display string only). The receipt no longer represents a GST component while the LLP is unregistered.
- **Test evidence:** new `email.test.ts` — *"M-1: never mentions GST … in text or HTML"* asserts no `gst` substring + presence of "no hidden charges". Existing receipt tests still green.

### M-2 · GST rate → 0 until registered · S2 · legal / data-integrity
- **What changed:** schema default `Package.gstRateBps` flipped `1800 → 0` (`prisma/schema.prisma:88`, column KEPT); both packages seeded with `gstRateBps: 0` (`prisma/seed.ts`); new migration `20260712100000_.../migration.sql` sets the column default to 0 and `UPDATE`s existing rows. Net: every new Order books `gstInPaise = 0` via the already-tested `gstFromInclusive` rate-0 path.
- **Key files:** `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260712100000_gst_rate_zero_until_registered/migration.sql`.
- **Risk:** requires the migration to be applied for the DB-level effect; `priceInPaise` (the single all-in price) is unchanged, so buyer charge is identical. `gstFromInclusive` untouched.
- **Test evidence:** existing `money-spine.test.ts` GST-rate-0 case (`gstInPaise = 0`) remains green; the change routes both real packages through it.

### A-1 · Orphan `/api/checkout` deleted · S1 · security
- **What changed:** removed `app/api/checkout/route.ts` (unauthenticated, no OTP, optional referral code — could mint users + live Razorpay orders). Confirmed via grep that no frontend/source references it (only the audit doc mentions it, as history). Build route list no longer contains `/api/checkout`.
- **Key files:** `app/api/checkout/route.ts` (deleted).
- **Risk:** the real checkout path (`app/checkout/actions.ts`, code+OTP+rate-limit) is untouched and remains the only order-creation entry.
- **Test evidence:** build succeeds with the route absent; `checkout-referral-gate.test.ts` (the real path) green.

### M-3 · Partial refund → manual review only · S2 · money
- **What changed:** `modules/payments/webhook-flow.ts` — in the `refund.processed` branch, `event.amountInPaise < order.amountInPaise` now returns a single `FLAG_MANUAL_REVIEW` (no `MARK_REFUNDED`, no `REVOKE_ENROLLMENTS`, no `CLAWBACK_COMMISSIONS`). Only an exact-amount refund is treated as a full refund (existing in-window/post-window logic unchanged).
- **Key files:** `modules/payments/webhook-flow.ts`, `tests/money-spine.test.ts`.
- **Risk:** none — pure decision engine; the change only *narrows* when auto-clawback fires (strictly safer). Post-window and exact-match paths byte-identical.
- **Test evidence:** new `money-spine.test.ts` — *"M-3: PARTIAL refund → manual review only, NO clawback/revoke (even in-window)"*; existing full-refund in-window/post-window cases still green.

### FV-1 · `earn` gate fail-closed + explicit GLOBAL SHOW · S2 · compliance
- **What changed:** `lib/feature-visibility/registry.ts` — `earn.defaultVisible` flipped `true → false` (fail-closed legal gate). Launch visibility is now an **explicit** GLOBAL SHOW `FeatureOverride` seeded in `prisma/seed.ts` (idempotent upsert) **and** inserted by the M-2 migration (`ON CONFLICT DO UPDATE`). Net: earn is visible **by intent**, not fail-open; an empty override table hides it. Payouts stay OFF (D-01 env flag, unchanged); commissions stay display-only/range (DR-043/D-29).
- **Key files:** `lib/feature-visibility/registry.ts`, `prisma/seed.ts`, the migration, `tests/feature-visibility.test.ts`, `tests/feature-visibility-admin.integration.test.ts`.
- **Risk:** **behavioral** — any environment without the GLOBAL SHOW row now hides the earn subtree. The seed + migration both add it, so migrated DBs are unchanged for users. Reviewer must confirm the migration ran on staging/prod. The resolver (hide-wins → show → default) is unchanged; a GLOBAL SHOW correctly reveals over the fail-closed default.
- **Test evidence:** `feature-visibility.test.ts` rewritten to the new contract — *"FV-1: no overrides → earn HIDDEN (fail-closed)"* and *"FV-1: an explicit GLOBAL SHOW reveals earn"*; ROLE/USER scoping tests now layer a GLOBAL SHOW base. Route tests (`network-export-route`, `kyc-doc-route`) mock earn-visible (launch state). 9/9 resolver tests green.

### AD-2 · Admin "Mark PAID" is D-01-flag-aware · S2 · money UX
- **What changed:** `app/admin/withdrawals/page.tsx` fetches `payoutsEnabled()`, shows a "Payouts disabled (D-01)" banner when OFF, and passes `canMark = kyc && amount && payouts` + `payoutsEnabled` into `components/admin/withdrawal-actions.tsx`. The client `onMarkPaid` now early-returns when payouts are OFF (never opens the "already transferred?" confirm), and the button title reflects the disabled reason.
- **Key files:** `app/admin/withdrawals/page.tsx`, `components/admin/withdrawal-actions.tsx`.
- **Risk:** UI-only. The server money-move gate (`canMarkWithdrawalPaid` → `PAYOUTS_DISABLED`) is unchanged and remains the authoritative block; this removes the UI invitation to transfer out-of-band.
- **Test evidence:** typecheck + build green; server gate covered by existing `withdrawal-payout.integration.test.ts` (unchanged). UI change is presentational.

### D-4 · KYC submit enforces verified email + WhatsApp server-side · S2 · PII
- **What changed:** `app/dashboard/earn/actions.ts` `submitKyc` loads the caller's `Kyc.emailVerifiedAt`/`whatsappVerifiedAt` and refuses submission unless both are set. `components/affiliate/kyc-form.tsx` disables the submit button until both flags are true and firms up the copy.
- **Key files:** `app/dashboard/earn/actions.ts`, `components/affiliate/kyc-form.tsx`.
- **Risk:** low — an extra server precondition on the PII write path; does not change encryption, audit, or the withdrawal rules. Verified-flag source is the existing `confirmContactVerification` stamp.
- **Test evidence:** typecheck/build green; existing KYC integration tests cover the submit/verify path (reviewer to run against migrated DB).

### Security S3 batch
| ID | Fix | Files | Test evidence |
|----|-----|-------|---------------|
| **A-2** | Throttle OTP **verify** (per-phone 6 / per-IP 15, 10-min window) added and wired into `verifyLoginOtp`, `resetPasswordWithOtp`, `verifyRegisterOtp`, `verifyCheckoutOtp` | `lib/auth/otp-rate-limit.ts`, `app/login|register|checkout/actions.ts` | new `otp-rate-limit.test.ts` — `evaluateOtpVerify` per-phone + per-IP throttle |
| **A-3** | CSV formula-injection: prefix cells starting `= + - @ \t \r` with `'` in both export builders | `lib/affiliate/network.ts`, `lib/admin/audit-log.ts` | new `affiliate-analytics.test.ts` — `=HYPERLINK(0)` name neutralized |
| **A-4** | `safeNext` rejects backslashes (browsers normalize `\`→`/` into a `//host` escape) | `lib/auth/post-auth.ts` | new `post-auth-redirect.test.ts` — `/\evil.com` etc. → null |
| **A-5** | Throttle the certificate OG-image route per IP (shares the `/verify` page's 20/min bucket); over-limit → neutral fallback, no name leak | `app/verify/[serial]/opengraph-image.tsx` | build green; mirrors the page limiter already tested |
| **A-6** | Console email provider masks the recipient (`b***@domain`) so no email PII lands in logs | `lib/email/provider.ts` | new `email.test.ts` — masked recipient; existing send tests updated |
| **AD-11** | `resolveReview` verifies a `FLAG_MANUAL_REVIEW` exists and is idempotent (no duplicate `REVIEW_RESOLVED`, no resolving arbitrary ids) | `lib/admin/review.ts`, `app/admin/review-queue/actions.ts` | typecheck green; adapter now returns a typed result the action forwards |
| **AD-4** | Zod schema on the quiz-draft payload (prompt non-empty, ≥2 options, `0 ≤ correctIndex < options.length`, passPercent 1–100) | `app/admin/catalog/quiz-actions.ts` | typecheck/build green |
| **AD-12 / D-13** | Zod (id min-1/max-64 + boolean) on presence-only admin actions: `markPaidAction`, `markInProgressAction`, `revealKycAction`, `setRewardActiveAction`, `setWebinarActiveAction` | `app/admin/withdrawals|kyc|rewards|webinar/actions.ts` | typecheck/build green |

### P-1 · "Kamao" tagline kept as an approved D-29 exception
- **What changed:** **no guardrail weakening.** Added a scope comment to `modules/ai/guru/guardrail.ts` clarifying it governs **dynamic** content only and the **static** tagline "Seekho. Badho. Kamao." is a founder-approved brand exception (no income number/guarantee), never routed through the guardrail. One-line notes added at the two tagline sites (`app/page.tsx`, `app/opengraph-image.tsx`).
- **Key files:** `modules/ai/guru/guardrail.ts`, `app/page.tsx`, `app/opengraph-image.tsx`.
- **Risk:** none — comments only; the guardrail regex and its strings are byte-identical (verified: `guardrail-strings.test.ts` green).

### P-4 · Terms + Privacy honest DRAFTs
- **What changed:** `app/terms/page.tsx` and `app/privacy/page.tsx` now render real India-edtech starting drafts — each topped with a bold **"DRAFT — pending legal review, not yet binding"** banner. Content covers: phone/OTP + Razorpay/Supabase data flows, refund cross-reference, PII-at-rest, unsubscribe, company = EDZERA INSPIRING EXCELLENCE LLP. **No income/earning guarantees** (D-29). Marked as requiring lawyer review before launch (LAUNCH_CONFIG #2/#3).
- **Key files:** `app/terms/page.tsx`, `app/privacy/page.tsx`.
- **Risk:** content is explicitly non-final; must be lawyer-reviewed before go-live. Both build as static pages.

---

## Money-lock re-check (explicit)

| Lock | Status after Wave 2 | Note |
|------|--------------------|------|
| **Money in paise (integer, no floats)** | ✅ intact | No arithmetic changed; M-2 routes packages through the existing integer rate-0 path; `priceInPaise` unchanged. |
| **Commissions credit only from verified idempotent webhook** | ✅ intact | Webhook signature/parse/idempotency untouched. M-3 only re-routes *partial* refunds to manual review; capture/credit path byte-identical. |
| **Double-entry ledger (≥2 balanced legs, derived balances)** | ✅ intact | No ledger builder, TxSpec, or balance query touched. GST is still never booked to the ledger (`GST_PAYABLE` remains unused). |
| **D-01 payouts hard-blocked** | ✅ intact + strengthened | Server gate `canMarkWithdrawalPaid`/`validateWithdrawal` unchanged; AD-2 additionally removes the UI's out-of-band-transfer invitation. `AFFILIATE_PAYOUTS_ENABLED` still the single kill-switch. |
| **DR-038 masking intact** | ✅ intact | Network L2/L3 selects unchanged; A-3 only *adds* an anti-injection prefix to already-exported L1 cells (no new fields exposed). |

**No autonomous money-math rewrites were made.** Ambiguities were flagged, not guessed — see below.

## Flagged for founder / Fable (not changed)
1. **M-2 column retention:** `Order.gstInPaise` and `Package.gstRateBps` are kept (now 0). Confirm whether to retain for post-registration use or drop later — finance decision.
2. **FV-1 rollout dependency:** the fail-closed default means the GLOBAL SHOW row **must** be present on every environment. Seed + migration both add it; confirm the migration is applied to staging/prod before this ships, or the earn subtree will 404 for all users.
3. **D-4 pre-existing rows:** any KYC submitted before this change (with unverified contacts) is unaffected retroactively; the gate applies to new/resubmitted KYC only. Confirm that's acceptable.
4. **M-5 (not in scope, still open):** post-commit receipt/analytics can be dropped on a crash-after-commit (audit S3). Left as-is per scope.

## Self-assessment (5 lines)
1. Every founder-specified fix is implemented exactly as directed; no money math or ledger logic changed beyond M-3's narrowing of auto-clawback to exact-amount refunds.
2. The one behavioral risk is FV-1 (fail-closed earn) — mitigated by seeding the GLOBAL SHOW in both seed and migration, but it hard-depends on the migration being applied; called out prominently.
3. Green bar is real: tsc + lint(0 err) + prettier + staging build + 396/396 unit tests; live integration suite is deferred to the reviewer because it needs the new migration on the shared DB and this session must not mutate it.
4. Tests were added/extended per fix (M-1, M-3, FV-1, A-2, A-3, A-4, A-6) and existing tests updated to the new contracts (feature-visibility default, email masking, OTP-verify mocks).
5. Terms/Privacy are honest, clearly-marked drafts — real content, but explicitly not final and pending legal review.
