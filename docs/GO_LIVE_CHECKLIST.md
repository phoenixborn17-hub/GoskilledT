# GoSkilled — Go-Live Checklist (Launch Hardening · Unit 5)

> **Purpose:** the single ordered list of everything a solo, non-developer founder must set to take the
> app from mock/dev to live. **Every provider is already flip-ready behind an env flag** — going live is
> an env change + redeploy, never a code change. **This doc adds NO keys and flips NOTHING** (readiness only).
>
> **Read alongside `docs/LAUNCH_CONFIG.md`** (the canonical registry — LC #n rows referenced below).
> **🔴 = money/PII/legal — route to Fable / counsel at the flip. Do NOT flip these casually.**

## How the flip works (mechanics)
Each external dependency is chosen by an env var (`lib/config/providers.ts`). The default is always the
safe **mock/console/test** mode. Setting the var to its live value + adding the credential + redeploying
switches it. A **production build refuses to boot** with any mock provider (`assertProductionProviderSafety`)
— so you can't accidentally ship half-live. Analytics, email, and AI are the deliberate exceptions (they
soft-warn instead of throwing, because a degraded log-only mode is not *unsafe*).

## Pre-flight (must be done before ANY live flip)
- [ ] 🔴 **Legal pages live** — Privacy, Terms, Refund, Disclaimer (LC #2–5). Razorpay activation requires them.
- [ ] 🔴 **Company/tax structure** — LLP / GST / money-routing decided (LC #6). Gates GST display + payouts.
- [ ] **Base infra env set** — `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (validated at boot by `lib/env.ts`).
- [ ] 🔴 **`PII_ENCRYPTION_KEY`** — a 32-byte base64 key, set in prod (required; KYC PAN/account/doc-paths won't decrypt without the SAME key used at write). **Never rotate after real KYC data exists** without a re-encrypt plan.
- [ ] **`EMAIL_UNSUBSCRIBE_SECRET`** — dedicated HMAC key in prod (LC #41; else unsubscribe links break on `DATABASE_URL` rotation).

## Provider flips (each is env-only; order below is the recommended sequence)

| Provider | Flag → live value | Also set | LC | Notes |
|---|---|---|---|---|
| **Supabase phone+password** | (dashboard setting, not env) | enable Phone auth + password | — | 🔴 Required before password register/login work live (Phase A follow-up). |
| **OTP / SMS** | `OTP_PROVIDER=live` | `MSG91_AUTH_KEY` | #21 | Throttles already live regardless. Test one real OTP. |
| **Razorpay (payments)** | `PAYMENT_PROVIDER=razorpay` | `RAZORPAY_KEY_ID` · `RAZORPAY_KEY_SECRET` · `RAZORPAY_WEBHOOK_SECRET` | #19, #33 | 🔴 **Fable at flip.** Needs legal pages first. Do a ₹1 live e2e (checkout → captured webhook → PAID → commissions HELD). Point the Razorpay dashboard webhook at `/api/webhooks/razorpay`. |
| **Cloudflare Stream (video)** | `VIDEO_PROVIDER=stream` | `CLOUDFLARE_STREAM_CUSTOMER_CODE` | #20 | Upload course + preview videos; set each lesson's `videoAssetId` via `/admin/catalog`. |
| **Resend (email)** | `EMAIL_PROVIDER=resend` | `RESEND_API_KEY` + verified domain | #22 | 🔴 Soft-warns in prod if left `console`. **Live smoke test at flip:** one real welcome + one cert-ready + working unsubscribe. |
| **PostHog (analytics)** | `ANALYTICS_PROVIDER=posthog` | `POSTHOG_API_KEY` | #24 | Soft-warns if left `console`. Not unsafe — no money/PII depends on it. |
| **Anthropic (Guru AI)** | `AI_PROVIDER=live` | `ANTHROPIC_API_KEY` | #35, #36 | 🔴 **Live smoke test (Fable):** a real corpus question, an income-intent question (must redirect per D-29 — see the locked `GURU_INCOME_REDIRECT` string test), and confirm the daily cost caps decrement. Set `GURU_MODEL` + cost caps (#36). |
| **KYC verify send** | `KYC_VERIFY_PROVIDER=live` | (wire a real email/SMS service — not built) | #47 | 🔴 PII. `live` currently throws until a delivery service is wired. Flow + flag are ready. |

## 🔴 The money flip — payouts (LAST, legal-gated)
- [ ] 🔴 **`D01_LEGAL_CLEARED=true`** only after written counsel clearance (LC #1) — this is the runtime precondition for the payout-flag ceremony.
- [ ] 🔴 **`AFFILIATE_PAYOUTS_ENABLED=true`** (LC #18) — flips earnings/withdrawals ON. Until then: `PAYOUTS_DISABLED` is enforced at both request-time (`validateWithdrawal`) AND the money-move site (`canMarkWithdrawalPaid`) — **zero disbursement possible while OFF**. Flip via `/admin/settings` ceremony (typed-confirm + audit). **Fable reviews the flip.**
- [ ] 🔴 **KYC private bucket** — confirm the `kyc-docs` bucket exists as **private** on the prod Supabase project (LC #48); created on first upload but verify it isn't public.

## Founder decisions still open (non-blocking, safe defaults shipped)
- [ ] Referral copy pre/post-D-01 (#17) · Register/Login/Checkout copy (#44) · Commission-structure copy (#45).
- [ ] Tier thresholds (#51, default Mentor≥5/Champion≥15) · Reward definitions (#53, none seeded) · My-Leads PII policy (#52 🔴 Fable).
- [ ] Withdrawal window: anytime vs Monday-only (#50) · KYC doc-type list (#49) · FAQ pending answers (#12).
- [ ] Course/preview/welcome videos (#7–10) · instructor bios/photos (#11) · certificate template (#14).

## Post-flip smoke (do once live)
- [ ] ₹1 Razorpay live purchase → PAID → 3 HELD commissions → 48h → AVAILABLE.
- [ ] One real OTP register + password login.
- [ ] One real welcome email + working unsubscribe.
- [ ] KYC submit with a real doc → admin review → (payouts still OFF until D-01).
- [ ] Re-run the QA-01 capture against the **production build** (dev over-reports CLS/LCP).

---
*Generated for launch hardening Unit 5. Adds no keys and flips nothing — readiness + docs only. Money/PII rows are marked 🔴 for Fable/counsel review at the actual flip.*
