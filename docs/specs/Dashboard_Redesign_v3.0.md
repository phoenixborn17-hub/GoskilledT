# GoSkilled Workspace Redesign — Product Vision + Build Spec v3.0 (FROZEN)

> **BINDING: `Frozen_Spec_Amendments_v1.0` (approved Fable P0/P1) overrides this spec where noted — esp. nav/naming per IA v2.0 (Explore not Marketplace; Guru AI = own workspace + floating; Account split).**

> **In-repo, self-contained spec (DR-027).** Supersedes `Dashboard_Redesign_v2.0` — expanded to the founder's Product Vision (2026-07-10). Functional site (A–E + Launch Hardening) merged on `main` (`61fe0d2`). This builds the **GoSkilled Workspace**: a **Home hub** + two workspaces — **Learn (green)** and **Earn (gold)** — as one premium product, **scratch-built** on Next.js 16 + Tailwind + shadcn/ui (no purchased theme).
>
> **Branch:** `gps-dashboard-redesign` off `main`. One session/tree.
> **Companion:** `GoSkilled_Product_IA_Blueprint_v1.0` — complete page-level IA (every page's purpose/sections/widgets/components/actions/data-source/built-new status) grounds these build units.
> **Tiers:** B (Opus) for all units. **Earn workspace** = money/PII surface → money-behaviour-frozen; escalate any money/PII data-shaping to **Fable Tier-A**. The **Feature Visibility System** is a separate spec (compliance-sensitive).
>
> **North-star (founder):** every screen answers — (1) *What should I do now?* (2) *What progress have I made?* (3) *What's my next best action?* — while feeling *premium, organized, built-for-me* (trust → engagement → retention → referrals).

## Founder decisions (2026-07-10) → DR-039
1. **3-surface model:** login → **GoSkilled Home** (action-first hub) → **Learn** / **Earn** workspace.
2. **Left sidebar** primary nav (Home · Learn · Earn · Marketplace · Account). **Supersedes the earlier top-right decision.** Desktop sidebar; mobile drawer + bottom bar; Share affordance prominent throughout.
3. **Depth via progressive disclosure — "deep, not dense"** (founder clarification, 2026-07-10): clean, action-first, **fast first paint**; rich sections reveal **on scroll** with excellent hierarchy/spacing/grouping. Useful widgets are **organized, never cut to reduce density**. Bounded by the performance gate + device-tier fallback (Hard Rule 7) and the zero-data honesty rule (Hard Rule 3).
4. Colorful premium cards retained (4–8; gradients/soft-shadows/micro-motion, device-tiered).

## Design priorities (founder, clarified 2026-07-10)
In order: **excellent information hierarchy · clean spacing & visual balance · progressive disclosure · fast first paint · premium animations where appropriate · high performance on all supported devices.** Principle: *don't remove useful widgets to reduce density — organize them better and position each correctly.* **Deep, not dense.** (Products like Binance/TradingView/ClickUp carry lots of info yet feel clean — the lever is hierarchy, not widget-count.)
**Research mandate:** don't let the shared references limit thinking — continuously research best-in-class dashboards (premium SaaS, fintech, AI apps, productivity, enterprise). If a better layout/UX/interaction pattern exists, **propose it**. Objective = build something *better* for GoSkilled, not replicate references.

## HARD RULES (read first)
1. **RE-SKIN IN PLACE for existing surfaces** — no route/business-logic edits; money math byte-identical. The **Home hub is a NEW composite surface** that only *reads/composes existing data* (no new money/business logic).
2. **No money-logic change; payouts OFF (D-01);** Earn is display-only over existing data.
3. **D-29 honest data — absolute.** Real data or an honest empty/loading/error state. **Even under "maximal richness," a zero-data user never sees empty or fabricated widgets** — they get the honest premium getting-started (§7). No fake numbers, ₹0 charts, placeholder graphs, or invented AI insights.
4. **GATE — DO NOT MERGE.** `main` untouched; park each unit; morning packet.
5. **Green each unit:** suite green + tsc/lint/prettier clean; money/non-regression suites green.
6. **Scratch, not naive.** Original components on our existing **shadcn/ui + Tailwind** (not a purchased theme). Reference premium products (Stripe, Linear, Notion, ClickUp, Shopify, Binance, TradingView, Airtable, HubSpot) for patterns — **study, never copy**. Everything owned = reusable GoSkilled IP.
7. **PERFORMANCE GATE + PROGRESSIVE DISCLOSURE (non-negotiable).** Depth is delivered by **progressive disclosure** — a clean, action-first first screen; richer sections revealed **on scroll** — never by cramming above the fold. **<2s first-meaningful-paint on a throttled budget-Android profile (4× CPU, Slow-4G)** is the floor; below-fold sections lazy-load/hydrate. Rich effects (glass/gradient/heavy shadow/motion) are **device-tiered**: full on capable devices, auto-reduced on low-end (`prefers-reduced-motion` + runtime capability check). A unit that blows the budget MUST ship the tier fallback — not optional.
8. **Data reality (D-29 corollary).** Wire only **existing** data (see §9 classification). Genuinely-new features (e.g. Assignments, XP/levels system, Daily Missions, admin CMS, proactive AI beyond rules) are **flagged and parked** for a founder decision — never faked to fill a section.

## §1. Navigation — left sidebar (full map)
Workspace-themed sidebar (green in Learn, gold in Earn, neutral on Home). Collapsible; mobile = drawer + a 4-item bottom bar (Home · Learn · Earn · Share). Persistent **Share** in the sidebar footer.
```
🏠 Home        Dashboard (hub) · Notifications · Activity Feed
🎓 Learn       Learning Dashboard · My Learning · My Courses · Assignments* · Certificates · Webinars · Guru AI
💼 Earn        Affiliate Dashboard · Network · My Leads · Wallet · Withdraw · Rewards · Leaderboard · Commission Structure
🛍 Marketplace  Explore Courses · Membership Plans · Refer & Earn
👤 Account      Profile · KYC · Settings · Support · Logout
```
`*` = flagged new-feature (see §9). Cardinal rule: user always knows the active surface (Home / Learn-green / Earn-gold). No search/Cmd+K.

## §2. GoSkilled Home (hub — NEW composite surface)
Action-first (never a bare "choose your path" gate). Sections, all from **real** state:
- **Welcome** — greeting + dynamic message (time · activity · progress · goals · achievements).
- **Today's Summary** — next lesson · today's webinar · streak · wallet available (only if > 0).
- **Quick Actions** — Continue Learning · Open Wallet · Refer Friend · Claim Reward · Open Guru · Join Webinar.
- **Priority Notifications** (grouped Today/Yesterday/Earlier).
- **Cross-workspace progress snapshot** + **Announcements** (admin-managed) + **Share** (link · copy · WhatsApp · QR).
- **Enter Workspace** — two premium cards: 🎓 Learning · 💼 Affiliate.
**Zero-data:** getting-started (§7), not empty widgets.

## §3. LEARN workspace (green) — section structure → REAL source
Founder's 13-section layout, richness under the perf gate; first viewport = greeting + hero + primary action.
1 Welcome · 2 **Dynamic Hero Banner** (admin CMS — §8; until built, render a static real promo, never fake) · 3 Quick Actions · 4 **Referral** (link·copy·share·QR·WhatsApp) · 5 **Premium Stat Cards** (4–8: Courses · Progress% · Certificates · Streak · XP* · Rank* · Upcoming Webinar) · 6 **Analytics** (learning activity · course completion · weekly progress — real, date filters) · 7 **AI Insights** (Guru, rules-based on real state — §5) · 8 Notifications · 9 Recent Activity Timeline · 10 Rewards/Badges/Levels* · 11 Daily Mission* · 12 Upcoming Events (webinars) · 13 Recommendations (next course).
Sources: LMS progress, certificates, quiz, gamification (streaks/badges), webinars, Guru, notifications, referral. `*` new — §9.

## §4. EARN workspace (gold) — section structure → REAL source (display-only)
Same 13-section skeleton, business-focused, gold theme.
1 Welcome (earn-momentum) · 2 Hero Banner (campaigns/offers — admin CMS) · 3 Quick Actions (Withdraw·Share·Upload Leads·Commission Structure) · 4 **Referral** (link·copy·QR·WhatsApp + commission value "Har referral pe ₹X") · 5 **Stat Cards** (Available balance [anchor only if >0] · Held · Total earned · Active L1 · This-month referrals · Rank) · 6 **Analytics** (earnings · network growth · payments · funnel "X of Y friends joined") · 7 AI Insights (real triggers) · 8 Notifications · 9 Recent referral activity · 10 Rewards · 11 Daily referral mission* · 12 Campaigns/Events · 13 Recommendations.
**Money honesty (locks):** payouts OFF (D-01) — always-visible honest status line ("Earnings recorded & safe; payouts open [status]"); copy **"₹X earned"** not "ready to withdraw"; never a fake "Paid." **DR-038** L1-export / L2-L3 mobile-masked. **DR-034/035** leaderboard ranks by **completed referrals**, learning-first language — never earnings/team-size. Sources: wallet (DR-025), commissions ledger, referrals tree, Phase-B graphs, KYC, withdraw status, leaderboard, rewards, my-leads.

## §5. Personalization + AI Insights (real state only)
Greeting priority: achievement → urgent action (supportive framing) → momentum → lifecycle (new = getting-started §7 · active · dormant) → time-of-day. **AI Insights = rules over real state** (e.g. "Continue Module 4" only if a module is genuinely in progress; "Webinar in 1 hour" only if scheduled). **No fabricated insight.** Copy in LAUNCH_CONFIG (Hinglish + icon+word).

## §6. Motion & visual quality (device-tiered — Hard Rule 7)
Gradients, layered depth, soft/rich shadows, tasteful glass, premium type (Sora + Inter), micro-interactions, hover states, smooth transitions, interactive charts — **all tiered**: full on capable devices; on low-end/`prefers-reduced-motion`, effects reduce to flat-but-clean, motion → instant state. Never decorative motion on the critical render path. Light-only at launch (dark tokens dormant).

## §7. Zero-data first-run (D-29 — applies across Home + both workspaces)
If `no purchase`(Learn)/`no referral`(Earn)/new → suppress empty stat cards + analytics; render greeting + one hero action + a **3-step Getting-Started** from real state (Learn: pick course → first lesson → share link · Earn: copy link → first share → first referral) + one-time 2-mark skippable tour (workspace switch + share) + "What is GoSkilled" card for `lifecycle=new`. Rich sections appear as real data appears (their first appearance = a reward).

## §8. Admin-controlled content (NEW admin sub-track — flagged)
Admin Panel controls: hero banners (rotating), announcements, home messages, featured widgets, promotions/campaigns, dashboard ordering, recommendations. **This is a new admin CMS feature (backend + admin UI) — sizeable; build as sub-track F-Admin, not blocking the consumer redesign.** Consumer side reads config with a real static fallback (never a fake banner). 

## §9. Data reality classification (CC MUST NOT fabricate)
**Built → surface beautifully:** courses/progress/continue, certificates, quizzes, streaks/badges/milestones, webinars, Guru AI, notifications, referral link/code, wallet (held/available), commissions ledger, referrals L1/L2/L3, earning/team/payment graphs, KYC, withdraw status, leaderboard (completed-referrals), rewards engine, my-leads, commission structure, courses/packages.
**Trivial presentation of real data → OK now:** QR code (generate from the real referral link).
**New feature → PARK + founder decision (do NOT fake):** Assignments, XP/points + Levels system (confirm vs existing gamification), Daily Missions, proactive AI beyond rules, Admin CMS (hero/announcements/ordering), Marketplace "Refer & Earn" page if beyond existing referral surfaces. CC surfaces these as "coming soon"/hidden until built — never a fabricated widget.

## §10. Fable structural amendments (carried, adjusted for maximal-richness)
Kept: **zero-data first-run (§7)** · **first-viewport CTA discipline** (north-star action visible without scroll at 360×640) · **Earn honesty** (§4) · **one-tap WhatsApp** (`wa.me` + pre-filled Hinglish message from real state; prefer over `navigator.share`) + **commission value at share point** · **single token source** (Unit 1; retire legacy `--gs-*`) · plain-language over jargon (no "conversion rate/funnel" wording) · leaderboard/rewards zero-state policy (hide/"unlocks…" not empty rank) · DR-038 masking one-liner · supportive streak framing · offline/"connection weak" banner. **Reframed per founder clarification (deep, not dense):** no strict landing element-cap AND no cutting of useful widgets — instead **excellent hierarchy + progressive disclosure** (clean action-first first screen; valuable sections organized down the scroll). Governed by the **performance gate (Hard Rule 7) + first-viewport discipline + zero-data honesty**. Depth is allowed; clutter, slowness, and empty/fake screens are not.

## §11. Units (build order, design-system-first)
- **U0** audit + build plan (existing components, shadcn primitives, token gaps, new-vs-built map §9).
- **U1** GoSkilled design system (single token source; green/gold; Sora/Inter; light + dormant dark; component library incl. stat card, chart card, table, sidebar, hero banner, share widget, getting-started, empty/loading/error; device-tier motion tokens). Retire `--gs-*`.
- **U2** App shell — left sidebar + workspace theming + mobile drawer/bottom-bar + persistent Share + Home hub scaffold.
- **U3** Home hub (§2).
- **U4** Learn workspace (§3).
- **U5** Earn workspace (§4) — money/PII, money-frozen, honesty locks.
- **U6** Personalization + rules-based AI insights (§5).
- **U7** Responsive + **performance gate proof** + a11y (absorbs Launch-Hardening perf). Report throttled-profile LCP/CLS/TBT per surface.
Each unit: green + tsc/lint/prettier; zero money-behaviour change; honest states; **perf-gate + first-viewport proof**; new-feature items parked not faked; before/after screenshot; **per-unit visual review before advancing**.

## §12. Recommended phasing (80/20)
**F1 — premium core:** Home + both workspaces' first-screen (greeting · hero · 4–6 stat cards · primary action · share · honest states) + sidebar + perf gate. Delivers most "wow + referral" value fast.
**F2 — OS richness:** full 13 sections, analytics depth, motion depth, rules-based AI, activity timelines.
**F-Admin:** admin CMS (hero/announcements/ordering) — separate sub-track.
**Feature Visibility System:** separate spec (`FeatureVisibility_System_v1.0`) — compliance-critical, likely launch-relevant.
Then trimmed Polish Plan (Phases 0-5 re-sequenced; this redesign supersedes ~half of 0 & 2).

## Out of scope
Money-logic/gating change · live keys/payouts · faking any new-feature data · replacing existing routes/data-access · purchased themes · the Feature Visibility System (own spec) · admin-CMS backend (F-Admin sub-track).

## Change log
- v3.0 — 2026-07-10 (Opus, steward) — expanded to founder Product Vision: Home hub + Learn/Earn workspaces, left sidebar (DR-039), rich under a hard performance gate + device-tier fallback + zero-data honesty; §9 data-reality classification (no fabricated new-feature widgets); Fable amendments carried/adjusted; Affiliate Visibility carved to its own spec; phasing F1/F2/F-Admin. Supersedes v2.0.
- v3.1 — 2026-07-10 (Opus) — founder clarification integrated: **"deep, not dense"** — depth via **progressive disclosure** (clean fast first paint; rich sections on scroll; excellent hierarchy), useful widgets **organized not cut**; added explicit design-priorities + research mandate; DR-040 broadened to a general feature-flag system (AI/Marketplace/Communities/Jobs). Performance gate + zero-data honesty unchanged.
