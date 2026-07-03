# LAUNCH_CONFIG — Canonical Launch-Dependency Registry (DR-029)

> **The single source of truth for every launch dependency.** If a value, policy, asset, or account is
> not final, it lives here. **Launch gate: zero PENDING rows before go-live.**
> Governed by the Two-Layer Development Rule (CLAUDE.md · DR-029): pending Layer-2 decisions never
> block Layer-1 development — they get a config slot in code and a row in this file.

**Status:** `PENDING` (awaiting decision/asset) · `IN PROGRESS` (being produced/negotiated) · `FINAL` (approved value live in code/config) · `DROPPED` (no longer needed)
**Type:** Business · Legal · Content · External Service · Configuration · Founder Decision
**Blocking Level:** `ARCHITECTURE` (stop dev — should almost never appear here; escalate immediately) · `LAUNCH` (must be FINAL before go-live) · `OPTIONAL` (can ship after launch)

**Rules of the registry**
1. Every configurable slot, placeholder copy block, feature flag default, or founder-pending asset added during development MUST get a row here in the same ticket.
2. A row moves to FINAL only when the approved value is actually in code/config/DB — not when it is merely decided.
3. Placeholder values must be truthful and clearly non-final. Fabricated business data is forbidden everywhere (D-29 floor).
4. Review cadence: every module close-out + a full sweep at the pre-launch review.

---

## Registry

| # | Item | Module/Page | Type | Status | Owner | Placeholder / Current Value | Final Value | Blocking | Target | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | D-01 Affiliate programme legality | affiliate (all earn surfaces) | Legal | PENDING | Founder + Counsel | Payouts OFF (`AFFILIATE_PAYOUTS_ENABLED=false`); earn UI shows "launching after review" | Counsel-approved programme rules | LAUNCH (for earnings activation, not for build) | Pre-launch | May alter commission model (AR-1). Build continues per DR-029. |
| 2 | Privacy Policy content | `/privacy` | Legal | PENDING | Counsel | Shell page, marked draft | Counsel-drafted text | LAUNCH | Pre-launch | Required for Razorpay activation. |
| 3 | Terms of Service content (+ certificate eligibility) | `/terms` | Legal | PENDING | Counsel | Shell page, marked draft | Counsel-drafted text | LAUNCH | Pre-launch | Required for Razorpay activation. |
| 4 | Refund Policy content | `/refund-policy` | Legal | PENDING | Counsel | Shell page, marked draft | Must state DR-025 mechanics exactly | LAUNCH | Pre-launch | Engineering to review final text vs DR-025. |
| 5 | Disclaimer content | `/disclaimer` | Legal | PENDING | Counsel | Shell page, marked draft | D-29-compliant text | LAUNCH | Pre-launch | |
| 6 | D-02 LLP partner status · D-03 GST · D-04 money routing · D-26 dev IP | company-wide | Legal | PENDING | Founder + CA | GST-inclusive single-price display works either way (DR-023) | Registered structure | LAUNCH | Pre-launch | No engineering dependency today. |
| 7 | Launch course 1 — AI & Prompt Mastery (recorded) | lms | Content | PENDING | Founder | Player/slots fully built; mock video in dev | Cloudflare Stream video IDs | LAUNCH | Pre-launch | **Critical path.** |
| 8 | Launch course 2 — Digital Marketing (recorded) | lms | Content | PENDING | Founder | Same as above | Stream video IDs | LAUNCH | Pre-launch | **Critical path.** |
| 9 | Free preview lessons (1 per launch course) | `/courses/[slug]`, dashboard | Content | PENDING | Founder | Preview slot built; YouTube-unlisted allowed (DR-022) | Recorded previews | LAUNCH | Pre-launch | Record BEFORE full courses (Day-0 experience). |
| 10 | Welcome / Lesson-0 video | onboarding/dashboard | Content | PENDING | Founder | Pending Day-0 spec approval; slot TBD in GPS-M2 delta | 60–90s recorded intro | LAUNCH (if Day-0 spec approved) | Pre-launch | Founder decision on Day-0 spec still open. |
| 11 | Instructor bio + team photos | `/about`, course detail | Content | PENDING | Founder | DR-028 Founding Team framing, text-only | Photos + final bios | LAUNCH | Pre-launch | |
| 12 | FAQ — 3 founder-pending answers | `/faq` | Content | PENDING | Founder | Questions omitted from render | Final answers | OPTIONAL | Pre-launch | Page live with current set. |
| 13 | Course outcomes copy (per course) | `/courses/[slug]` | Content | PENDING | Founder | Generic outcomes, marked draft | Course-specific outcomes | OPTIONAL | Pre-launch | |
| 14 | Certificate template + serial format | lms (Slice 1.5) | Founder Decision | PENDING | Founder | Schema slot exists (`Certificate`) | Approved design + format | OPTIONAL | Post-launch OK (Slice 1.5) | |
| 15 | Commission rates (₹900/150/75 · ₹1,250/250/150) | affiliate config | Configuration | FINAL* | Founder | DR-007 values in `modules/affiliate/commission` | Same, unless D-01 forces change | LAUNCH | — | *FINAL per DR-007 but flagged: D-01 outcome may reopen (AR-1). |
| 16 | Package pricing ₹1,499 / ₹2,199 | `Package` table, `/packages` | Configuration | FINAL* | Founder | DR-010 values in DB seed | Revisit after conversion data | — | — | *Locked for launch. |
| 17 | Referral copy — pre-D-01 vs post-D-01 | earn card, share flows | Configuration | PENDING | Founder + Counsel | "Invite friends" framing; zero earn language | Post-D-01 approved copy set | LAUNCH | Pre-launch | Copy slots; D-29 floor applies to both sets. |
| 18 | `AFFILIATE_PAYOUTS_ENABLED` master flag | env + admin settings | Configuration | PENDING | Founder | `false` | `true` on D-01 clearance | LAUNCH (activation) | Post-D-01 | Flip = founder action, logged. |
| 19 | Razorpay live account + activation | payments | External Service | PENDING | Founder | `PAYMENT_PROVIDER=mock` | Live keys + webhook secret | LAUNCH | Pre-launch | Needs legal pages (#2–5). Then ₹1 live e2e test. |
| 20 | Cloudflare Stream account + customer code | video | External Service | PENDING | Founder | `VIDEO_PROVIDER=mock` | `CLOUDFLARE_STREAM_CUSTOMER_CODE` | LAUNCH | Pre-launch | |
| 21 | MSG91 live OTP credentials | auth | External Service | PENDING | Founder | `OTP_PROVIDER=test` (Supabase test numbers) | `MSG91_AUTH_KEY`, provider=live | LAUNCH | Pre-launch | |
| 22 | Resend key + sending domain | email receipts | External Service | PENDING | Founder | `EMAIL_PROVIDER=console`; `EMAIL_FROM` default noreply@goskilled.in | Verified domain + key | LAUNCH | Pre-launch | Console-in-prod soft-warns only. |
| 23 | PostHog project key | analytics | External Service | PENDING | Founder | `ANALYTICS_PROVIDER=console` | Live key | OPTIONAL | Pre/post-launch | Console fallback acceptable. |
| 24 | Production domain + DNS + `NEXT_PUBLIC_APP_URL` | deployment | External Service | PENDING | Founder | localhost default | goskilled.in (or final) | LAUNCH | Pre-launch | |
| 25 | Supabase PITR enabled | database | External Service | PENDING | Founder | Not enabled | PITR on | LAUNCH | Before real money | Blueprint §5 requirement. |
| 26 | Contact email / WhatsApp / hours | `/contact`, footer | Business | PENDING | Founder | Temp values, marked draft | Final contact set | LAUNCH | Pre-launch | |
| 27 | Webinar schedule (two-session model) | `/webinar` | Business | PENDING | Founder | Model built; no session dates | Recurring schedule + Event JSON-LD | LAUNCH | Pre-launch | |
| 28 | `PII_ENCRYPTION_KEY` (32-byte base64) | kyc (Phase 4) | Configuration | PENDING | Engineering + Founder | Env-validated in prod; module not yet needed | Generated + stored in Vercel | LAUNCH (before KYC/payouts) | Phase 4 | Encryption lib ships with Phase 4. |
| 29 | Day-0 experience spec (registration flow, Hub, Lesson 0) | auth/dashboard | Founder Decision | PENDING | Founder | Current: login-only entry (DR-023 checkout unchanged) | Approved GPS-M2 delta + DR-030 | LAUNCH | Before Phase 2 build of Hub | Design discussed 2026-07-03; awaiting founder sign-off. |
| 33 | Razorpay TEST-MODE keys for staging | payments (staging) | External Service | PENDING | Founder | `PAYMENT_PROVIDER=mock` + `npm run verify:loop` (no Razorpay account) | Razorpay **test-mode** `RAZORPAY_KEY_ID`/`KEY_SECRET`/`WEBHOOK_SECRET` (signup only — dashboard → Test Mode; NO business activation/KYC) | OPTIONAL (pre-live testing step for #19) | Before #19 go-live | Lets staging run a real Razorpay sandbox checkout before the live account (#19) is activated. Mock loop already proves the pipeline end-to-end. |

---

**Changelog**
- 2026-07-03 — Created per DR-029 (Two-Layer Development Rule); seeded with all known pending items from GPS Master v1.1 §19, M1 close-out residuals, and CTO Audit 2026-07-03.
- 2026-07-04 — Added #33 (Razorpay test-mode keys for staging) as the pre-live testing step for #19; full DR-029 dev dataset seeded + `npm run verify:loop` proves the mock checkout→certificate→verify loop end-to-end. (M3 rows #30–32 land with the GPS-M3 merge, post-Fable-review.)
