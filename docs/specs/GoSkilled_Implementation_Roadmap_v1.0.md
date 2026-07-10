# GoSkilled — Master Implementation Roadmap v1.0

> **The single implementation guide** for the remainder of the project. Claude Code executes it **phase by phase** until production-ready. Consumes the frozen specs: `GoSkilled_Product_IA_Blueprint` (v2.0), `Dashboard_Redesign_v3.0`, `GoSkilled_Experience_System_v1.0`, `FeatureVisibility_System_v1.0`, `DESIGN_DIRECTION` (constitution), Decision Register (DR-001…040).
>
> **Governance (every phase):** GATE — no self-authorized merge; **park-don't-merge**, morning packet; DR-027 — specs live in `docs/specs/` (CC can't see Genesis); **D-01** payouts OFF till written legal; **D-29** no fabricated data; re-skin-in-place (no money-math change); green suite + tsc/lint/prettier each unit; Tier-B (Opus) default, **money/PII/compliance → Fable Tier-A**.
>
> **Status: APPROVED & FROZEN (founder, 2026-07-10).** Fable P0/P1 incorporated via `Frozen_Spec_Amendments_v1.0`. Specs frozen. CC executes **Phase 0 → 10**. This is the single implementation guide — no more redesign absent a genuine architectural issue.

## 1. Current state (BUILT — merged on `main`)
Phase A–E + Launch Hardening merged (`61fe0d2`, 64 test files / 421 tests green). Live: public site · auth (mobile+password+OTP+referral gate) · LMS (courses/player/progress/certs/quiz/Guru) · affiliate engine (referrals/wallet/commissions/KYC/withdraw-request — **payouts OFF**) · engagement (leaderboard/rewards/my-leads) · admin (users/payments/leads/review/KYC/withdrawals/catalog/webinar/audit/settings) · security (rate-limits/headers/skip-link) · PWA shell. Staging: `goskilled-t.vercel.app`.

## 2. Implementation audit (raised BEFORE build — genuine issues)
| # | Issue | Type | Action / owner |
|---|---|---|---|
| A1 | **Repo git HEAD reports broken in the sandbox** ("Failed to resolve HEAD") | Bottleneck | **Verify real-machine git state + clean working tree before CC cuts any branch.** If real repo is fine, it's a mount artifact; if not, fix first. |
| A2 | **Cross-doc naming/nav drift** — Dashboard v3.0 §1 sidebar still says "Marketplace" and omits the AI/Guru workspace; IA v2.0 governs (Explore + Guru AI) | Consistency | **Phase 0**: steward aligns Dashboard §1 → IA v2.0 before U2. (Fable P0-7) |
| A3 | **Legacy `--gs-*` tokens** must become the single source in Unit 1 (DR-039 P0-5) | Tech debt | Reconcile/retire in Phase 1; no dual token systems. |
| A4 | **D-01 written legal** (commission/direct-seller/TDS-GST/terms) = payout launch gate | Hidden dependency (founder-lane) | Founder obtains written scope; until then payouts stay OFF. Non-blocking for everything else. |
| A5 | **LAUNCH_CONFIG zero-PENDING + provider keys** (Razorpay/OTP/Stream/Resend/analytics) = go-live gate | Dependency | Tracked in `GO_LIVE_CHECKLIST`; founder sets keys at Phase 10. |
| A6 | **Money-never-fail-to-zero** rule missing from widget registry | Risk (trust) | Add Error state + "currency renders only from real data; on failure → Retry, never ₹0/blank" (Phase 1/Experience System). (Fable P0-2) |
| A7 | **Earn zero-state eligibility fork** — own-purchase required to earn (DR-038); current 3-step "share now" misleads not-yet-eligible users | Risk (D-29/trust) | Two variants (Phase 4). (Fable P0-3) |
| A8 | **Feature-Visibility leak channels** — notifications, activity feed, profile referral code, mobile bottom-bar recomposition, marketing-site earn copy | Compliance risk | Add to DR-040 acceptance (Phase 7). (Fable P0-1/§8) |
| A9 | **Home composes 5 data sources** — perf-gate risk on the most-visited page | Perf | Composed first-viewport payload + streamed sections (Phase 2). (Fable P0) |
| A10 | **New-feature items parked** (Assignments · XP/Levels · Daily Missions · Admin CMS · AI Tools · future workspaces) | Scope | Founder confirms which (if any) enter scope; else stay "coming soon", never faked. |
| A11 | **CSP header** deliberately deferred (money-flow origins) | Security | Fable Tier-A co-design at Phase 10 (Razorpay/Supabase/Stream/PostHog origins). |
| A12 | **GST registration** → Orders & Invoices | Dependency (founder-lane) | Founder-lane; invoices ship after GST. |
| A13 | **Device-tier heuristic defined in 3 docs, no shared definition** | Consistency | Define ONCE in Experience System §8 (governs motion + glass/blur). (Fable P1) |

## 3. Phased roadmap
Phases 1–6 implement `Dashboard_Redesign_v3.0` Units 0–7. Each phase below carries the 9 required attributes.

### PHASE 0 — Pre-build alignment (steward + light CC)
- **Objective:** unblock a clean build; kill drift.
- **Features:** align Dashboard §1 sidebar/labels → IA v2.0 (A2); confirm git state (A1); confirm parked-feature decisions (A10); final spec-amendment pass for Fable P0s (A6/A7/A8 + naming).
- **Dependencies:** none.
- **Files:** `docs/specs/Dashboard_Redesign_v3.0.md`, `Experience_System_v1.0.md`, `FeatureVisibility_System_v1.0.md`, IA blueprint.
- **Risks:** low (docs only).
- **Complexity:** S.
- **Testing:** n/a (spec).
- **Completion:** specs frozen; git clean; parked decisions logged.
- **Review before next:** founder sign-off on frozen specs.

### PHASE 1 — Design System foundation (Redesign U0–U1)
- **Objective:** the single token + component source of truth built.
- **Features:** tokens (green/gold/neutral ramps, semantic, **dark dormant**), Sora/Inter type scale, spacing/radius/elevation, **device-tier heuristic (single def)**, ~55-component library on shadcn/ui + card families, chart/sparkline standards, **retire `--gs-*`**, money-never-fail-to-zero + Error state baked into every data component.
- **Dependencies:** Phase 0.
- **Files:** `app/globals.css`, `tailwind.config`, `components/ui/**`, `components/cards/**`, `lib/format` (Indian digit grouping), `lib/device-tier.ts`.
- **Risks:** token reconciliation regressing existing surfaces (mitigate: visual diff on marketing/LMS).
- **Complexity:** L.
- **Testing:** component render tests; visual snapshots; a11y checks; no-regression on existing pages.
- **Completion:** every component renders from tokens, green↔gold theme switch works, dark dormant defined, existing pages unbroken.
- **Review before next:** Opus Tier-B + **founder visual pass** on the built system (style tile → real components).

### PHASE 2 — App shell + Home hub (U2–U3)
- **Objective:** the navigation frame + the composite Home hub.
- **Features:** left **sidebar** + WorkspaceSwitcher (green/gold/neutral) + top bar + notifications + profile menu; mobile drawer + bottom bar; **persistent Share**; **Home hub** (Today's Summary, contextual Quick Actions ≤4, priority notifications, Enter-Workspace cards carrying the snapshot, announcements, share); zero-data getting-started; **choreographed workspace-switch crossfade** (Fable P1); Home **composed first-viewport payload + streamed sections** (A9).
- **Dependencies:** Phase 1.
- **Files:** `app/(app)/layout.tsx`, `components/nav/**`, `app/(app)/home/**`, `app/api/home-summary/**`.
- **Risks:** perf on Home (5 sources); nav recomposition for DR-040 (stub now, wire Phase 7).
- **Complexity:** L.
- **Testing:** shell nav e2e; Home perf on throttled profile; skeleton/stream order; a11y (keyboard/focus).
- **Completion:** sidebar reaches every module; Home <2s first paint throttled; zero-data path clean.
- **Review before next:** Opus Tier-B + founder visual pass.

### PHASE 3 — Learn workspace (U4)
- **Objective:** re-skin Learn into the deep-not-dense 5-section + content hierarchy.
- **Features:** Learn dashboard (Continue hero, ≤4 stat cards, Activity tab, widgets), My-Learning/Courses/Player (data-saver 480p toggle, resume-position — Fable P1), Certificates (+share-cert WhatsApp), Webinars, Guru-in-context; zero-data getting-started; honest states.
- **Dependencies:** Phases 1–2.
- **Files:** `app/(app)/learn/**`, `components/cards/learning/**`, `app/dashboard/**` (migrate).
- **Risks:** re-skin must not touch player signed-URL/leak-tested logic (presentation only).
- **Complexity:** M–L.
- **Testing:** money/logic non-regression; player integrity; empty/loading/error; first-viewport CTA at 360×640.
- **Completion:** all Learn pages on the design system, real data, honest states, perf gate held.
- **Review before next:** Opus Tier-B + founder visual pass.

### PHASE 4 — Earn workspace (U5) — money/PII · **Fable Tier-A**
- **Objective:** re-skin Earn, display-only, money-honesty locks, trust-first.
- **Features:** Earn dashboard (referral object + honest "₹150–₹250 per referral" range, needs-attention chips, stat cards with **balance-anchor-only-if>0**), **eligibility-forked zero-state** (A7), Wallet sub-views (Transactions/Credits/Pending-with-48h-trust-framing/Refund-Adjustments/Withdraw-History/Statements), **Withdraw truth-surface** (not a dead-end; honest status + notify-me; form only when gate open) (A6-adjacent), Network + Referral Profile (DR-038 mask/export), Leaderboard (completed-referrals, self-pin + distance-to-tier), Rewards, Commission Structure, KYC ("get payout-ready" framing); **no count-up on money**; **Register-2 calm theming** (thin gold accents only); fixed **no-income-guarantee** brand line.
- **Dependencies:** Phases 1–2.
- **Risks:** **highest** — money/PII presentation over live ledger; any data-shaping change → Fable Tier-A. Payouts stay OFF (D-01).
- **Complexity:** L.
- **Testing:** money non-regression suites green; DR-038 masking/export; zero money-behaviour change (diff = presentation); KYC doc access-control intact; honest states incl. **Error≠₹0**.
- **Completion:** Earn fully re-skinned, display-only proven, trust surfaces in place, Fable Tier-A PASS.
- **Review before next:** **Fable Tier-A** + Opus + founder visual pass.

### PHASE 5 — Explore · Guru omnipresent · Account · AI insights (U6)
- **Objective:** remaining workspaces + personalization.
- **Features:** Explore (course detail with **trust-triad at the Buy CTA**, plans, checkout **success = activation moment**, Refer&Earn), **Guru omnipresent** (top-bar entry every workspace + in-context chips; **no mobile FAB**; streaming, static prompt chips), Account split (Profile/KYC/Settings/Security/Notifications/Support/Help/About), personalization greeting + **AI insights (rules over real state, honest)**.
- **Dependencies:** Phases 1–4.
- **Files:** `app/(app)/explore/**`, `app/(app)/account/**`, `app/(app)/guru/**`, `components/guru/**`, `lib/personalization/**`.
- **Risks:** Guru income red-team (no earnings claims); AI insights must be real triggers (D-29).
- **Complexity:** M.
- **Testing:** Guru safety (income red-team); insight-trigger correctness; checkout success flow; a11y.
- **Completion:** all 6 workspaces live on the system; Guru everywhere; honest insights.
- **Review before next:** Opus Tier-B (Guru safety spot-check) + founder visual pass.

### PHASE 6 — Responsive · performance gate · a11y · share surfaces (U7)
- **Objective:** hold the perf gate; ship trust/share surfaces.
- **Features:** <2s throttled per workspace, device-tier effects proven, lazy analytics, **font strategy** (subset/preload/Devanagari-on-demand), **referral landing own perf budget (<1.5s)**, PWA shell + cached summary + "updated X min ago" on money, WCAG AA sweep, **WhatsApp OG preview surfaces** (referral · certificate-image · course) (Fable P0-§8), staggered scroll reveal (capable tier).
- **Dependencies:** Phases 1–5.
- **Files:** `next.config`, `app/opengraph-image.tsx` + per-route OG, `app/manifest.ts`, `lib/og/**`.
- **Risks:** OG cert-image render cost; perf recapture needs prod build (dev over-reports).
- **Complexity:** M–L.
- **Testing:** before/after LCP/CLS/TBT per workspace (prod build); OG render tests; a11y audit; Lighthouse budget-Android.
- **Completion:** perf gate met on all surfaces; OG cards render; PWA installs; a11y AA.
- **Review before next:** Opus Tier-B + founder review. **← Consumer redesign (Phase F) complete here.**

### PHASE 7 — Feature Visibility System (DR-040) · **Fable Tier-A · compliance-critical**
- **Objective:** clean enable/disable of any feature/module/workspace per user/role/global; reviewer sees Learning-only, zero affiliate trace.
- **Features:** feature-registry + `isFeatureVisible()` resolver (routes/APIs/actions enforced server-side, not CSS), graceful recomposition (sidebar/Home/bottom-bar), admin UI + audit, fail-safe default. **Leak-channels in acceptance (A8):** notifications, activity feed, profile referral code, mobile bottom-bar Learning-only composition, marketing-site earn-copy review variant.
- **Dependencies:** Phases 2–5 (surfaces exist to hide).
- **Files:** `lib/feature-visibility/**`, `middleware.ts`, nav builder, `app/admin/feature-visibility/**`, `prisma` (features table).
- **Risks:** a single leak defeats the purpose (Razorpay/AdSense review). Money logic untouched (visibility only).
- **Complexity:** L.
- **Testing:** with Affiliate hidden (each scope) — direct-URL/deep-link/API all 404/redirect/empty; no affiliate nav/widget/text/notification/activity anywhere; layouts recompose no gaps; unhide restores exact state; second dummy flag proves extensibility; money non-regression green.
- **Completion:** reviewer session = coherent Learning-only product; **Fable Tier-A leak-hunt PASS**.
- **Review before next:** **Fable Tier-A** + Opus + founder.

### PHASE 8 — Admin Console expansion (domain-based; phased)
- **Objective:** admin scales to a real ops console.
- **Features (priority order):** **8a (launch-relevant):** Refund/Chargeback console + **Commission-Clawback UI** (logic BUILT DR-025) · immutable-audit coverage (payout-enabled/KYC-approved/wallet-adjust/impersonation/flag-changes) · Notification Center (broadcast + sent/opened/clicked). **8b (post-launch):** Reconciliation (Razorpay→settlement→wallet→ledger→bank) · Impersonation ("Viewing as X" + fully logged, permissioned) · CMS versioning (draft/publish/rollback) · Support console · Analytics dashboards · AI/Email/WhatsApp logs.
- **Dependencies:** Phase 1 (design system) + money data (built).
- **Files:** `app/admin/**` (domain routes), `lib/admin/**`, `modules/**` (read-only over ledger).
- **Risks:** money-adjustment tools = highest audit sensitivity → **Fable Tier-A for refund/clawback/reconciliation**; impersonation = security-sensitive.
- **Complexity:** L (split 8a/8b).
- **Testing:** clawback correctness (ledger reversal, idempotent) non-regression; audit immutability; impersonation fully logged + permissioned; RBAC.
- **Completion:** 8a shipped for launch; 8b reserved/scheduled.
- **Review before next:** Fable Tier-A (money tools) + Opus.

### PHASE 9 — Platform Services + integrations (reserve/wire)
- **Objective:** "running the platform" layer.
- **Features:** background jobs board (scheduled/running/failed/completed) · monitoring (health/queue/storage/payments/errors) · integrations registry (Razorpay/OTP/Resend/Stream/PostHog BUILT; WhatsApp planned; Gmail/Drive/Calendar reserve) · analytics wiring (PostHog) · AI services/logs. Mostly wire to existing infra + minimal dashboards.
- **Dependencies:** none hard.
- **Complexity:** M (mostly reserve).
- **Testing:** job idempotency; alerting smoke; integration health checks.
- **Completion:** ops visibility exists; integrations documented + flip-ready.
- **Review before next:** Opus Tier-B.

### PHASE 10 — Launch readiness & go-live
- **Objective:** production.
- **Features:** LAUNCH_CONFIG zero-PENDING · provider keys live behind flags · **written D-01 legal → flip payouts** (Fable Tier-A at the flip) · **CSP co-design** (A11) · GST → Orders & Invoices (A12) · session-management screens (Session-Expired/Too-Many-Attempts) + WebOTP · full e2e journeys (register→learn→cert · refer→earn · KYC→withdraw) · prod-build perf recapture (LCP/TBT) · security final (pen-pass) · deploy + rollback plan + monitoring live.
- **Dependencies:** all prior + founder-lane (legal/GST/keys).
- **Risks:** payout flip = irreversible money path → **Fable Tier-A + founder ceremony**.
- **Complexity:** L.
- **Testing:** full e2e on real budget-Android; money live-path dry-run (still gated); load; security.
- **Completion:** production checklist green; go-live.
- **Review before next:** Fable Tier-A (money flip) + founder go-live ceremony.

## 4. Backlog (complete task queue)
**🔴 Critical (must build — launch blockers):** Phase 1 design system · Phase 2 shell+Home · Phase 3 Learn · Phase 4 Earn (+eligibility zero-state, Withdraw truth, money-fail-safe) · Phase 5 Explore/Guru/Account · Phase 6 perf-gate+a11y+OG · Phase 7 Feature Visibility · Phase 8a refund/clawback UI + audit coverage · Phase 10 launch (LAUNCH_CONFIG, keys, D-01 legal, CSP, e2e, session screens, deploy).
**🟠 High:** Notification Center · WhatsApp OG surfaces · Orders & Invoices (post-GST) · KYC "payout-ready" reframe · trust-triad placements · font/perf strategy · referral-landing perf budget · PWA caching · WebOTP.
**🟡 Medium:** Reconciliation · Impersonation · CMS versioning · Support console · Analytics dashboards · AI/Email/WhatsApp logs · monitoring · background-jobs board · full-screen QR · leaderboard self-pin/tier-distance · Credits "how-calculated" row.
**🟢 Future:** Assignments · XP/Levels · Daily Missions · Admin CMS depth · AI Tools/Studio · reserved workspaces (Jobs/Community/Challenges/Events/Mentors) · Gmail/Drive/Calendar integrations · dark-mode enable · contact-picker invites · adaptive learning paths · one R3F marketing-hero (post-LCP-proof).

## 5. Missing-work checklist (TPM lens — nothing overlooked)
- **Infra:** device-tier util · Indian money-format util · OG-image pipeline · PWA cache · font subsetting · composed-summary API.
- **Integrations:** Razorpay live keys · OTP/SMS (WebOTP origin tag) · Resend · Stream · PostHog wiring · WhatsApp (deep-links now; API later).
- **UI:** ~55-component library · card families · 6 workspaces · Home hub · admin domains · all 8 states per surface.
- **Backend/APIs:** home-summary · feature-visibility resolver · OG render · notification broadcast · admin refund/clawback/reconciliation (read+write over ledger) · analytics events.
- **Validations:** Zod at every new server-action/route (My-Leads pattern) · quiz-actions deeper validation (carried) · rate-limits on any new sensitive endpoint.
- **Admin:** domain reorg · refund/clawback · reconciliation · impersonation · notification center · CMS versioning · feature flags · audit coverage.
- **Testing:** component/visual/a11y · money non-regression (every phase) · feature-visibility leak-hunt · e2e journeys · perf (prod-build, throttled) · security.
- **Security:** CSP co-design · impersonation logging/permissions · KYC doc access (built) · rate-limits · audit immutability · RBAC review.
- **Performance:** perf gate <2s/workspace · referral landing <1.5s · font strategy · lazy analytics · device-tier glass/motion · Home streaming.
- **Deployment:** provider keys · LAUNCH_CONFIG zero-PENDING · staging→prod promotion · rollback plan · monitoring/alerting live · prod-build perf recapture.

## 6. Fable final-polish register (2026-07-10 cross-review)
All items respect locks; steward-endorsed. **Incorporated into phase acceptance** as noted; a small set are thin-adds (not pure re-skin) flagged for founder.
- **P0 → folded:** DR-040 leak-channels (P7) · widget Error state / money-never-₹0 (P1) · Earn eligibility zero-state (P4) · Withdraw truth-surface (P4) · WhatsApp OG surfaces (P6) · "Referred by [name] ✓" at register (P5/thin-add) · naming/nav drift fix (P0) · Home composed payload (P2).
- **P1 → folded:** Register-2 calm theming · no count-up on money · copy-link micro-interaction · commission range honesty (₹150–₹250) · chart ≥3-points rule · held-balance trust framing · KYC "payout-ready" · Guru top-bar (no FAB) · trust-triad at CTA · device-tier single-def · font strategy · referral-landing budget · workspace-switch crossfade · sub-page next-action rule · Home section subtraction.
- **P2 → backlog:** full-screen QR · leaderboard self-pin/tier-distance · Credits how-calculated row · Indian digit grouping · toast offset · staggered reveal · light-source depth rule · "as-of" timestamps · micro-tilt on Home cards.
- **Thin-adds (not pure re-skin — founder note):** WebOTP · WhatsApp OG render pipeline · "Referred by [name]" (reads sponsor) · certificate-image OG. All high-ROI, low-risk; approve to include in their phases.
- **Biggest insight (adopt as doctrine):** *for GoSkilled, premium-feeling = trust-feeling.* The top world-class levers are honesty surfaces (Withdraw truth, eligibility-honest Earn, sponsor-name register, WhatsApp preview), not visual flourish.

## 7. How Claude Code uses this
Execute **one phase at a time**, in order. Each phase: read the referenced frozen spec section → branch off `main` (after prior phase merged) → build unit-by-unit behind GATE → park + morning packet → steward review (tier as marked) → merge on founder paste → Genesis changelog/queue sync → next phase. Never self-merge. Never fabricate data. Money/PII/compliance phases → Fable Tier-A. If a spec gap is found mid-phase, halt + flag steward (don't guess).

## Change log
- v1.0 — 2026-07-10 (Opus, Implementation Director) — master roadmap: current-state, pre-build audit (13 issues incl. git-HEAD bottleneck + naming drift), 11 phases (0–10) each with objective/features/deps/files/risks/complexity/testing/completion/review-gate, full backlog (Critical/High/Medium/Future), TPM missing-work checklist, Fa