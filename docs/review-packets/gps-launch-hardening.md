# Review Packet — Launch Hardening (perf · a11y · security · tests · go-live)

**Branch:** `gps-launch-hardening` (off `main` @ `871cd89`). **`main` untouched; nothing merged (GATE).**
**Spec:** `docs/specs/LaunchHardening_v1.0.md` (FROZEN). **Diff:** `docs/review-packets/gps-launch-hardening.diff` (~10 files).
**Routing:** all Opus Tier-B. **Money/PII items flagged for Fable — none changed.**
**Gates:** `tsc` clean · **full suite 64 files / 421 tests (+16)** · eslint 0 errors (4 pre-existing warnings) · prettier clean · **zero money-logic behaviour change** (non-regression suites green).

---

## built X / flagged Y — TL;DR

**Built (additive, safe, tested):**
- **U3 Security & validation** — new per-user/IP throttle applied to the spec's named endpoints (withdraw request, KYC submit, both KYC doc-access routes); Zod-at-boundary on the 2 remaining guard-only admin actions; smoke test now locks all 5 security headers; PII-in-logs audit = **clean**.
- **U5 Go-live checklist** — `docs/GO_LIVE_CHECKLIST.md` maps every provider env flag + LAUNCH_CONFIG row → founder action; confirms all adapters are flip-ready. No keys, no flips.
- **U4 Test coverage** — comprehensive `validateWithdrawal` rule-ordering test + contact-config test.
- **U2 Accessibility** — skip-to-content link + `#main-content` landmark (WCAG 2.4.1) at the layout level, covering every route without touching a page file. Verified live on `/`.
- **U1 Performance** — measured; confirmed the critical public routes already meet budget (see below); no unsafe change warranted.

**Flagged (not changed — for Fable / follow-up / founder):**
- 🔴 **Content-Security-Policy** → Fable Tier-A. Deliberately still omitted: a correct CSP must be co-designed with the Razorpay/Supabase/Cloudflare-Stream/PostHog/next-og origins, and a wrong one silently breaks the money flow. The 5 safe headers are present + now tested.
- 🔴 The withdraw/KYC throttles sit on **money/PII paths** — they change **no rule** (single-pending + `validateWithdrawal` still own the decision), but flagged for Fable awareness.
- `app/admin/catalog/quiz-actions.ts` free-form `QuizDraftInput` — admin-gated, still validated only at the domain layer; recommend a dedicated deeper-validation pass.
- **Dashboard perf + `/courses` DOM/caching** — deferred to Phase F (consumer-dashboard redesign) / too uncertain to change safely under "trivial-only".
- Accurate **LCP/TBT** need a **production-build** QA re-capture (dev over-reports; QA harness runs `npm run dev`).

---

## Per-unit detail

### Unit 3 — Security & validation (`c2fb3ab`, `e522e8a`)
- **Rate-limits (new `lib/auth/action-rate-limit.ts` — pure `evaluateActionRate`, tested 4 cases):** per-user (primary) + per-IP (×3, secondary). Applied: `requestWithdrawal` (6/10min — **abuse only, no withdrawal-rule change**, single-pending already caps spam), `submitKyc` (8/10min, PII write), owner KYC doc route (30/10min → 429), admin KYC doc route (60/10min → 429).
- **Zod sweep:** `updateLeadStageAction` (leadId + stage enum) and `resolveReviewAction` (orderId) were guard-only → now Zod-validated at the boundary. (All other actions already validate — the codebase is disciplined; `quiz-actions` free-form draft flagged above.)
- **Headers:** `next.config.mjs` already sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS. The smoke test asserted only 3 → **now asserts all 5**. CSP flagged for Fable.
- **PII-in-logs audit:** read every suspicious `console.*` in `lib/`/`app/`/`modules/` — all log **internal ids** (idempotencyKey, order.id, dedupeKey) + error `.message` only. `lib/kyc/verify-provider.ts` masks the target and is dev-only + never logs the code. **No PII leaks found.**
- **Authz/owner-scoping:** confirmed consistent — admin routes re-check `getAdminUser`, owner routes `getCurrentUser` + `canAccessKycDoc`, network export is L1-only + owner-scoped.

### Unit 5 — Go-live readiness (`205aa8f`)
`docs/GO_LIVE_CHECKLIST.md`: pre-flight (legal/infra/`PII_ENCRYPTION_KEY`), a per-provider flip table (OTP→`OTP_PROVIDER=live`+MSG91; Razorpay 🔴; Stream; Resend 🔴; PostHog; Anthropic 🔴; KYC-verify 🔴), the money flip (D-01 → `D01_LEGAL_CLEARED` → `AFFILIATE_PAYOUTS_ENABLED` via the `/admin/settings` ceremony), open founder decisions, and a post-flip smoke list. Confirms the boot guard (`assertProductionProviderSafety`) prevents shipping half-live.

### Unit 4 — Test coverage (`dcd0370`)
`tests/withdrawal-rules.test.ts` — every rejection code + full precedence (payouts→KYC→pending→amount→min→max→available) + boundary inclusivity; pure, asserts existing behaviour. `tests/contact-channels.test.ts` — the invite-only contact helper. Plus `tests/action-rate-limit.test.ts` (Unit 3).

### Unit 2 — Accessibility (`1f3513c`)
Skip link (first focusable, `sr-only` until `focus:not-sr-only`) → `#main-content` landmark wrapping `{children}` in the root layout — one change covers **every route** (dashboard page files untouched). Verified: `/` returns 200 with the link + landmark in SSR HTML; no layout break. **Audit findings:** icon-only controls consistently carry `aria-label` (recon), reduced-motion is globally gated, `focus-visible:ring` is in the UI primitives, no positive-tabindex misuse, no raster images (so no alt gaps). **Deeper contrast/heading-order via axe** needs the staging `playwright.a11y.config.ts` + `qa-auth-bootstrap` — recommended as a staging step.

### Unit 1 — Performance (measurement + confirmation, no code change)
Baseline from `docs/qa/QA-01/results.json` (width 360, **dev server** — advisory):

| Route | LCP (ms) | CLS | domNodes |
|---|---|---|---|
| `/` | 968 | 0.000 | 420 |
| `/packages` | 2780 | 0.144→**fixed** | 266 |
| `/faq` | 2780 | 0.210→**fixed** | 257 |
| `/courses` | 3184 | 0.000 | 1289 (heaviest) |
| `/login` | 4916 | 0.000 | 77 |
| `/register` | 3520 | 0.005 | 79 |

Findings: the critical public routes are **already lean** — server-rendered, **zero raster images** (all inline SVG/lucide → no `next/image` migration exists to do), inline-SVG charts (no heavy chart lib on any route), and loading skeletons present on `/courses` + `/packages`. The `/packages` + `/faq` CLS and the 4 hydration mismatches were already fixed in the earlier Unit-3 work (U3-A/B) — live numbers should be lower than this pre-fix baseline. The heavy client bundle (guru-panel, lesson-player, certificate-moment, confetti) is **dashboard/admin-only**, off the critical path and inside the Phase-F redesign freeze. `next/dynamic` is used nowhere, but the safe targets are all dashboard-side. Rather than fabricate a perf change or risk `/courses` caching semantics, Unit 1 = honest measurement + confirmation; the remaining targets are flagged (Phase F + prod-build re-capture).

## Non-regression
All money/PII suites green — **no ledger/commission/withdraw/payout behaviour changed** (the throttles are pre-domain abuse guards). `withdrawal-payout`, `money-flow`, `earning-gate`, `refund-mirror`, `kyc-*`, `checkout-mock` all pass.

## Checklist
- [x] `tsc` clean · 421/421 tests · eslint 0 errors · prettier clean
- [x] Additive/correctness only; no design-language change; **no consumer-dashboard page edited**
- [x] Zero money-logic behaviour change (non-regression green); payouts stay OFF (D-01)
- [x] Commits parked; **`main` untouched (`871cd89`)**; nothing merged
- [ ] Opus Tier-B review · [ ] Fable (CSP + money/PII-path throttles) · [ ] founder authorization (GATE)
