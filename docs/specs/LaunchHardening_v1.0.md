# Launch Hardening — Build Spec v1.0 (FROZEN)

> **In-repo build spec (self-contained).** The functional website (Phase A–E) is merged on `main` (`871cd89`). This is a **non-design, launch-quality hardening sweep** — make the merged app *fast, accessible, secure, well-tested* for a budget-Android Tier-2/3 audience and a money/PII product. Tier: **B (Opus) for most; anything touching money/PII/behavior → FLAG for Fable, don't change.**
>
> **Branch:** cut `gps-launch-hardening` off current `main`. One session per working tree.
> **HARD RULES:** (1) **DO NOT MERGE — `main` untouched** (GATE). (2) **No design-language changes, and DO NOT touch the consumer dashboard surfaces being redesigned** (Phase F, separate). (3) **No money-logic behavior changes** — ledger/commission/withdraw/payout stay byte-behaviour-identical; payouts stay OFF (D-01). (4) Additive/correctness only; keep the suite green + tsc/lint/prettier clean at each unit. (5) Park each unit with tests; **morning packet**; flag money/PII/behavioural items for Fable instead of changing them.

## Unit 1 — Performance (budget-Android <2s budget)
Measure first (throttled profile: ~4x CPU slowdown, Slow-4G), then safe improvements: route-level code-splitting / dynamic import of heavy client components; lazy-load below-the-fold; ensure charts stay inline-SVG/lightweight (no heavy chart libs on critical routes); image/asset optimization (`next/image`, sizing, formats); skeleton loaders where a spinner or blank exists; sensible caching/`revalidate`. **Report before/after LCP/CLS/TBT per key route.** Do not restructure the consumer dashboard (Phase F).

## Unit 2 — Accessibility (WCAG 2.1 AA)
Audit every merged surface: colour contrast, visible focus states, full keyboard navigation, ARIA roles/labels, image alt text, form label associations, ≥44px tap targets, reduced-motion honoured. Fix violations (these are correctness, not design-language). Add an a11y check to the test/CI where practical.

## Unit 3 — Security & validation hardening
Complete the validation sweep (Zod at EVERY server-action/route boundary + length caps — the My-Leads fix pattern); confirm rate-limiting on all sensitive endpoints (OTP, login, withdraw, KYC, doc-access, exports); add security headers (CSP, HSTS, X-Frame-Options, etc.) via middleware/next config; audit that NO PII is ever logged; confirm admin-authz + owner-scoping consistency across all routes. **Trivial/safe fixes only; FLAG anything that changes money/PII behaviour for Fable.**

## Unit 4 — Test coverage & robustness
Raise coverage on under-tested paths; make the staging-gated e2e journeys (register→learn, affiliate view, KYC→withdraw-request) runnable; add missing edge-case tests (auth, referral-gate, withdrawal gates, KYC access-control). Keep everything green.

## Unit 5 — Provider go-live readiness (NO live keys, NO flips)
For every provider adapter (Razorpay · OTP/SMS · Cloudflare Stream · Resend · Analytics · AI): confirm it is **flip-ready behind its env flag** with the mock→live switch documented; produce a single **"go-live checklist"** doc mapping each `LAUNCH_CONFIG` row → what the founder must set. **Do NOT flip anything live, add no keys, change no money behaviour** — read-only readiness + docs. Razorpay/money items → note for Fable at the flip.

## Acceptance (per unit)
Each unit ships with evidence: perf before/after numbers; a11y violations fixed (list); validation/rate-limit/headers in place; new tests green; go-live checklist complete. Full suite green; tsc/lint/prettier clean; **zero money-logic behaviour change** (non-regression suites green); no consumer-dashboard-redesign edits.

## Morning deliverable
One consolidated packet `docs/review-packets/gps-launch-hardening.md` (per-unit summary, commits, tests, perf numbers, flagged Fable items). `main` untouched; nothing merged.

## Out of scope
Consumer dashboard redesign (Phase F) · going live / real keys / real money movement · any new features.

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — launch-quality hardening sweep (perf · a11y · security · tests · go-live readiness); non-design, no money-behaviour change; park-don't-merge.
