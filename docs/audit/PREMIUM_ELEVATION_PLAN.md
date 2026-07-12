# GoSkilled — Premium Elevation Plan

**Engagement:** Product Design Director · Phase 1 (understand + critique → plan). **No code changed.**
**Date:** 2026-07-12 · **Basis:** latest `main` (`696d493`), branch `gps-premium-plan`
**Method:** three deep craft-reads of the real component code (dashboard · earn+public · auth+admin) against `docs/DESIGN_DIRECTION.md` + `docs/specs/*`, plus live inspection of the running app (public homepage, split-screen login, authenticated shell) across desktop/mobile, plus code verification of the three founder-raised items.
**Constraints honored:** no new palette/font (green #137E49 / gold decorative / charcoal; Sora + Inter), no fabricated data (D-29), payouts OFF (D-01), budget-Android < 2s / LCP < 2.5s, device-tiered motion + static fallback, WCAG AA. Nav v1.1 treated as LOCKED unless a spec-change is explicitly proposed.

> **The Value Filter** was applied to every recommendation below: each one names the product value it improves (trust · perceived quality · usability · engagement · learning · conversion · retention · maintainability). Anything that was "merely different" was cut.

---

## 1. Executive Summary

### The verdict: a genuinely premium system, applied to only half the product.

GoSkilled has already built something most startups never get: a **real design system with a point of view** — the DecisionCard "depth recipe," the Spark accent, the Living Skill Universe, a device-tiered motion model, a disciplined `--gs-*` token layer, and an honesty architecture (Founding Batch instead of fake testimonials, monograms instead of AI faces, honest-zero three-state). Where that system is fully applied, the product is legitimately 8–8.5/10 and feels like it belongs next to Duolingo, Notion, and Linear: the **Home hub**, the **Learn dashboard**, the **Earn hub**, the **public homepage**, the **welcome medallion**, and the **admin trust ceremonies** (payout flag, KYC reveal, withdrawal guards).

But there are **two GoSkilleds inside this app.** The surfaces where a user actually *spends time and money* are written in an older, pre-token vocabulary and score 4–6/10:

- **The course player** — the single highest-value surface, the place learning actually happens — is the least premium screen in the product. It renders inside full global chrome (no focus), styles itself in legacy `charcoal/muted/brand` tokens, shows progress as the plain text "3 / 12 lessons" while a `ProgressRing` sits two screens away, and ends a completed lesson on a dead stop instead of pulling the learner forward.
- **The Earn interiors** (wallet, commissions, network, leaderboard, rewards, KYC) are self-labeled in their own code as "MINIMAL consumer surface — premium redesign deferred." A user crossing from the premium Earn *hub* into the Earn *wallet* falls off a quality cliff — on the most trust-critical screen in a money product, in a scam-wary market.
- **The admin money tables** (payments, users) bypass the shared `DataTable`, and money columns aren't `tabular-nums` — figures don't align, so the ops surface reads less engineered than the trust ceremonies sitting on top of it.

**This is adoption debt, not invention debt.** The components to fix nearly all of it already exist (`OtpInput`, `DataTable`, `ProgressRing`, `SemicircleGauge`, `MilestoneTrack`, the DecisionCard family, `.dc-number`). The highest-leverage work is not designing new things — it is **finishing the application of the system the team already built**, starting at the learning core and the money interiors. That is squarely what DR-031's Product Polish Sprints are for.

**Second theme: the Spark is the untapped signature.** GoSkilled's one true distinctive mark — the accent dot with the breathing halo — lives only inside DecisionCards. Extended as the product's connective thread (a greeting bullet, the endpoint of the player's progress ring, a switcher pip when attention is owed, the certificate seal accent, the tier medallion) it would make every surface *recognizably GoSkilled* without a single new color or font.

**Third theme: trust is fragmented.** The public site ships at least four different "trust triad" treatments; the Earn interiors carry the reassurance line but drop the trust hierarchy the spec mandates; and the premium `AuthShell` frame is abandoned exactly at the checkout money-moment. Trust is the product's stated #1 job — it should be expressed through *one* consistent system.

### Overall premium-ness by zone (honest scores)

| Zone | Score | One-line reason |
|------|:---:|---|
| Public homepage / Living Skill Universe | 8 | A real signature moment, honest, cohesive — but the hero's left column is standard SaaS and the universe drops below the fold on mobile. |
| Home hub / Learn dashboard / Earn hub | 8.5 | The system fully applied — bento hierarchy, honest-zero, DecisionCards, real AI lines. |
| Welcome / onboarding success | 8 | The membership medallion is a genuine belonging peak. |
| Admin (money/KYC trust ceremonies) | 8 | Authoritative, safe, server-guarded — best-judged trust design in the app. |
| Course detail / Packages | 7.5 | Convert well and stay honest; boilerplate "what you'll learn" is the weak link. |
| Profile / Account / Settings | 7 | Correctly calm, honest toggles — but three identical white cards with no anchor. |
| Admin data tables | 6.5 | Two table systems; money not `tabular-nums`; no sort. |
| **Course player (the learning core)** | **6** | **Least premium surface, off-system, no focus, no momentum — and it's the highest-value one.** |
| KYC form | 6 | Safest-feeling interior, but raw file inputs on the highest-anxiety screen. |
| **Earn interiors (wallet/commissions/network/leaderboard/rewards)** | **4–5** | **Self-labeled "redesign deferred" — admin-grade tables where trust is won or lost.** |
| Checkout money-moment | 6.5 | Drops the AuthShell frame + segmented OTP; success state is a raw order-ID dump. |

### The 10 highest-impact moves, platform-wide

1. **Re-skin the course player onto the token system and give it a focus mode.** Highest-value surface, lowest craft. (learning · perceived quality · retention) — **L**
2. **Elevate the two money interiors that decide trust — Wallet and KYC — onto the DecisionCard system.** (trust · conversion) — **M**
3. **Fix the journey break: build in-app course browse + detail so authenticated users never land on marketing chrome.** (usability · trust · retention — founder #1) — **M–L**
4. **Unify the two design vocabularies** (retire legacy `charcoal/muted/brand/offwhite/rounded-2xl` for `ink/surface/theme/dc-*`) across the ~13 legacy dashboard components. (perceived quality · maintainability) — **L, sliceable**
5. **Consolidate 4+ trust treatments into one `TrustTriad` component with per-context slots**, used on every public CTA and every Earn interior. (trust · consistency) — **M**
6. **Turn lesson-complete into a momentum moment** — promote "Next lesson," preview up-next, tick the progress ring on completion. (retention · completion) — **S–M**
7. **Wire real money typography everywhere** (`.dc-number` Sora/tabular on Earn interiors + right-aligned `tabular-nums` on all admin money columns). (trust · usability) — **S–M**
8. **Extend the Spark as the connective brand mark** (greeting bullet · player ring endpoint · certificate seal · tier medallion · honest switcher pip). (perceived quality · memorability) — **M, sliceable**
9. **Carry the premium frame through the money+activation flow** — AuthShell + segmented OtpInput into checkout; redesign the checkout success into the opening beat of the welcome celebration. (conversion · trust) — **M**
10. **Retire the flat `EmptyState` primitive onto DecisionCard depth + real illustration**, so every zero-state lifts at once and no interior *reduces* the UI at zero (a ThreeState violation on Wallet/Progress today). (trust · first-run retention) — **M**

### The defining "signature moments" (what should make GoSkilled memorable)

- **The lesson ring that fills as you watch** — bind the player's header `ProgressRing` (Spark on its endpoint) to video progress, snapping forward on completion. The learning core becomes distinctly GoSkilled.
- **The "clearing" wallet** — held commissions shown as soft stacked layers that settle into Available as their 48h window closes. Turns the D-01 "payouts off" constraint into a confidence artifact instead of an apology.
- **The Skill Universe as navigation, not decoration** — tapping a node lights a connector from "You" to that skill and scrolls to the live course, making the hero the site's primary gesture.
- **The trophy shelf** — a certificate seal that stamps onto a course card at 100%, turning "My Courses" into visible pride.
- **The continuous celebration** — checkout success → welcome medallion as one escalating "You're in the Founding Batch" arc, instead of a raw order-ID between two screens.

---

## 2. Cross-Cutting Elevation System (build once, apply everywhere)

These are the reusable upgrades that keep elevation consistent instead of becoming per-page hacks. Every Phase-2 surface slice should draw from these, not reinvent them.

**CC-1 · One vocabulary (the consistency spine).** ~13 `components/dashboard/*` files and the `[courseSlug]` player still use `text-charcoal / text-muted / text-brand / bg-offwhite / rounded-2xl / raw text-2xl`; the rest of the app uses `text-ink / text-ink-muted / text-theme-strong / bg-surface-raised / rounded-gs / dc-*`. Live count on the Home page alone: new-system classes (`ink` 91, `dc-` 73) sit *beside* legacy (`charcoal` 63, `brand` 86, `muted` 11). This straddles the §19 Consistency Test ("if it could pass as a different project's page — reject"). *Value: perceived quality + maintainability.* This is the substrate for CC and every dashboard slice — do it per-surface as each is touched, not as a big-bang.

**CC-2 · One card-depth language.** `StatCard` (flat) and `DecisionCard` (radial tint + accent ambient shadow + inner highlight + Spark) coexist on the same screens, so pages read as two systems stacked. Give `Card` a lighter share of the DecisionCard recipe, or promote metric rows to a DecisionCard metric variant, so depth is one continuum. *Value: perceived quality.*

**CC-3 · Bare numbers → owned viz.** The team built `ProgressRing`, `SemicircleGauge`, `MilestoneTrack`, `NetworkNodes`, `AreaChart`, `Sparkline` — yet key metrics still render as plain digits ("Overall progress %", player "3/12", wallet `text-2xl`). The DecisionCard spec explicitly bans the "bare 72%" pattern. Wire the viz that already exists. *Value: learning · engagement.* (S each.)

**CC-4 · One money-number treatment.** `.dc-number` (Sora + `tabular-nums`, de-emphasized unit) exists but is used only on the consumer hub. Apply it to Earn interiors and give every admin money column `tabular-nums` + right-alignment so INR aligns on the decimal and columns scan. *Value: trust · usability.*

**CC-5 · One `TrustTriad`.** Collapse the current ≥4 bespoke trust sets (TrustTriad, TrustChips, hero inline list, home Trust strip, footer ribbon; plus Earn's dropped triad) into a single component with per-context content slots, placed at every decision point (each public CTA, checkout pay button, each Earn interior). *Value: trust · consistency.*

**CC-6 · Rich zero-states as a rule, never a reduction.** Retire the flat off-token `EmptyState` onto the DecisionCard depth + a real illustration, and audit every surface that *shrinks* the UI at zero (Wallet flag-off, Progress milestones, My Courses) to instead render the full honest-zero shell with unlock micro-states. The hub already does this; the interiors violate the same law the hub honors. *Value: trust · first-run retention.*

**CC-7 · The Spark as connective tissue.** Promote the Spark out of DecisionCards into the brand's recurring mark: the greeting bullet, the player progress-ring endpoint, an honest-trigger switcher pip, the certificate seal accent, the tier medallion. One motif, zero new tokens, instant recognizability. *Value: perceived quality · memorability.*

**CC-8 · Level-1 motion parity.** The specs mark route/workspace transitions and value-change animation as Level-1 ("absence is a defect"). Today workspace switches are hard swaps, progress rings fill on mount but not on *value change*, and the notification bell has no state. Add a shared themed route transition + a "ring re-fills on progress" hook. Device-tiered, reduced-motion-gated. *Value: perceived quality.*

**CC-9 · Course media identity.** Every course card uses the same green-gradient `PlayCircle` placeholder, so grids read as identical rows. Until real thumbnails land, vary the placeholder by course (category tint / initial / icon). *Value: usability.* (S.)

---

## 3. Dashboard — Per-Surface (the deepest priority)

Experienced as a daily learner. Scores are honest against the Linear/Stripe/Duolingo bar *within* the fast-mobile-first mandate.

### 3.1 Home hub — **8.5/10**
Best surface in the app: Namaste greeting + streak-aware subline, a bento "Today's summary" led by a Continue-Learning hero with a progress ring, Suspense-streamed snapshots with zero-CLS skeletons.
- **Reorder for the returning learner (S).** The first thing below the greeting is a static "Browse the Store" strip — the eye lands on an upsell before momentum. For the 90% case (a learner opening the app to continue), Continue should out-rank Store. *Value: usability · engagement.* Impact: high (daily first glance).
- **Let the greeting carry a live stake, not just mood (S).** Replace "pick up where you left off" (which duplicates the hero) with real lifecycle stakes: "2 lessons to your certificate" / "Day 5 — your best week yet." *Value: engagement · retention.*
- **Make the Announcements banner earn its place (S).** It's a hardcoded "Welcome to the Founding Batch" that never changes — furniture by day 3. Dismiss-and-stay-dismissed, or rotate real lifecycle nudges. *Value: perceived quality.*
- **Signature:** a **"today's spark" line** in the greeting zone — one honest, personal sentence from real lifecycle state, bulleted with the Spark dot, so the brand mark greets the user by name each morning.

### 3.2 Learn dashboard — **8.5/10**
Continue hero with a real AI line, ≤4 honest-zero stat cards, Overview/Activity tabs, real-catalog recommendations.
- **Unify the stat row with the hero's depth (M).** The four `StatCard`s (flat) sit under a `DecisionCard` hero (deep) — two systems stacked. Promote to the DecisionCard metric variant. *Value: perceived quality (CC-2).*
- **"Overall progress %" → a gauge (S).** A bare number where `SemicircleGauge`/`ProgressRing` already exist — the exact anti-pattern the DecisionCard spec bans. *Value: learning · engagement (CC-3).*
- **Surface the momentum, don't hide it behind a tab (S).** The 14-day activity chart *is* the proof of momentum for an active learner; put a sparkline inline on the streak stat so the tab is a "deeper look," not the only look. *Value: engagement.*
- **Signature:** a **"path to certificate" mini-track** on the Continue hero (the `MilestoneTrack` you own) — lesson dots filling toward a seal, so every visit shows the finish line closer.

### 3.3 Course PLAYER — **6/10 — the critical surface**
Functionally thoughtful (server-gated playback, data-saver, resume-from-mm:ss, WhatsApp error report, quiz checkpoint, confetti + certificate moment) but **visually the least premium surface, and off-system.** It does not feel like a premium place to learn.
- **Re-skin onto tokens + add focus (M, very high impact).** It renders inside the full 72px rail + 232px sidebar + topbar — the learning environment competes with global chrome. Swap `charcoal/muted/brand` for `ink/surface/theme`; replace "3 / 12 lessons" text with a header `ProgressRing`; render the active lesson-list item in the Spark/`dc-accent` language; optionally collapse the contextual sidebar to a slim rail while a lesson is active. *Value: learning · perceived quality · consistency (§19).* This is the product's core loop — it should be its best surface, not its weakest.
- **Turn completion into momentum, not a dead stop (S–M).** After a lesson, "Next lesson" and "Mark complete" are equal-weight outline buttons; promote Next to primary, preview the up-next title, and tick the header ring up with the spec's 300ms fill. *Value: retention · completion* (the 91%-vs-20% thesis in DESIGN_DIRECTION §4).
- **Give module headers real hierarchy (S).** Modules are `text-xs uppercase muted` labels; a learner in a 40-lesson course can't see which module they're in. Add a per-module progress hint. *Value: usability.*
- **Note (defect, not design):** the locked-lesson CTA hardcodes `/checkout?package=career-booster` regardless of the course's actual package (also a W1/W2 candidate).
- **Signature:** the **lesson ring that fills as you watch** — bind the header `ProgressRing` (Spark endpoint) to `video.currentTime`, closing as the lesson plays and snapping forward on complete. Built entirely from components already owned.

### 3.4 My Courses — **7.5/10**
Clean owned grid with smart Start/Resume/Review CTAs and the honest "included as released — no dates promised" Career-Booster roadmap (excellent D-29 trust craft).
- **Fix the empty state (S).** It uses the off-token flat `EmptyState`, and the copy borders the §15-banned "No courses yet." The bar is "Start your first lesson — 2 minutes." *Value: trust · perceived quality (CC-6).*
- **Distinguish owned vs discover cards (S–M).** Both use the same gradient placeholder; only the badge/CTA differ. §12 wants owned vs unowned obvious at a glance. *Value: usability (CC-9).*
- **Signature:** a **completion seal** that stamps onto a card at 100% — the owned grid becomes a trophy shelf.

### 3.5 Progress & Certificates — **8/10**
The per-course `SemicircleGauge` is genuinely premium; Milestones and the leak-tested CertificateCard with WhatsApp share are strong.
- **Add a page-level summary hero (S).** It jumps straight to per-course cards; a learner with 5 courses has no "3 certificates · 68% average" landing. One aggregate gauge gives the eye its primary anchor. *Value: engagement.*
- **Show Milestones for brand-new users too (M).** They only render when `courses.length > 0`, so a new user sees the plain EmptyState instead of the rich honest-zero milestone track — exactly what ThreeState says to stop doing. *Value: first-run retention (CC-6).*
- **Signature:** a **"your journey" ribbon** across the top — one horizontal milestone track threading all enrolled courses into a single growth story.

### 3.6 Profile / Account · Security / Settings — **7/10**
Correctly Register-2 calm; honest toggles that don't fake state (D-29), support-mediated phone/deletion framing.
- **Give Account an identity header (S–M).** Three near-identical white cards with no anchor. A `ProfileCard` header (avatar + name + Founding-Batch + member-since) — the component already exists and isn't used here. *Value: perceived quality.*
- **Make "Active sessions" reassure harder (S).** It shows only "This device"; add last-sign-in or an honest "we show this device only for now" line — reassurance is Register-2's whole job. *Value: trust.*
- **Signature:** a calm **"account health" card** (profile complete · password set · KYC status) as the primary layer.

### 3.7 The Shell — **8/10**
Nav v1.1 is well-realized: thin 72px switcher + contextual sidebar, `[data-theme]` re-themes the subtree, DR-040 recomposition, desktop-rail == mobile-bottom-bar, persistent Share. Live-verified: effortless 1-tap switching, generous 60px mobile tap targets, no horizontal overflow at 375px, correct `data-theme="neutral"` on Home. The two-nav problem is genuinely killed.
- **Kill the triple-label redundancy (S).** Topbar title, sidebar header, and active switcher label all say the same word ("Home"/"Learn" ×3 on screen). Let the sidebar header carry the workspace snapshot (progress %, streak) instead of repeating the label. *Value: usability · perceived quality.*
- **Fix the dead notification bell (M).** Live-confirmed: the Bell has no click handler and no unread indicator — a dead control on every screen. Wire a real notifications panel or give it an honest "nothing new" popover. (Also W1 finding SC-1.) *Value: trust · perceived quality.*
- **Add a route/workspace transition (M).** Switches are instant hard swaps; a ~200ms themed cross-fade sells the "OS app-switcher" feel the nav doc chases (Level-1 motion, CC-8). *Value: perceived quality.*
- **Signature:** an **honest switcher pip** — a Spark dot on a workspace when attention is owed (streak at risk on Learn, payout cleared on Earn), honest-trigger only.

### Dashboard cross-cutting → see §2 (CC-1, CC-2, CC-3, CC-6, CC-7, CC-8 all originate here).

---

## 4. Public — Per-Surface

Does the rest of the site live up to the Living Skill Universe bar? **Close — ~7.5 average, one true signature moment, honest throughout.**

### 4.1 Homepage + Living Skill Universe — **8/10**
The Skill Universe is real — nodes from the live catalog, honest live/soon, accessible `<button>`s, SVG connectors, CSS-only 60fps, device-tiered, legible with JS off. Not a standard SaaS hero. Live-verified rendering.
- **Rescue the mobile signature moment (M).** The hero's left column is a standard SaaS block (badge + 3-line headline + 2 buttons + trust list); the universe is the showpiece but drops *below the fold on mobile* — so the whole target audience may never see it above the CTA. Lead mobile with a compact universe teaser. *Value: engagement · the brief's "first-viewport desire."*
- **Resolve the tagline tension (S).** The hero gradient-highlights "**Kamao.**" (earn) as the payoff word while the public site is deliberately earn-free (D-29). *(Founder has ruled Kamao a keeper as a brand tagline — W2 documents this; the design note is only that the eye lands on "earn" with no earn content. Consider letting "Badho" share the emphasis so the honest promise and the visual accent agree.)* *Value: trust/honesty-lock.*
- **Signature:** make a Skill-Universe node **navigational** — tap lights a connector from "You" to the skill and scroll-links to that live course.

### 4.2 Course detail — **7.5/10**
Converts and stays honest: learning-timeline curriculum, free-preview locks, verifiable-certificate preview, sticky buy card, TrustTriad at the CTA.
- **Kill the boilerplate outcomes (M — biggest desire leak here).** "What you'll learn" is a hardcoded `OUTCOMES` const (self-labeled "COPY: draft") — four identical bullets on every course. A scam-wary buyer notices boilerplate on the conversion-critical page. Make outcomes per-course (data-driven). *Value: conversion · trust.*
- **Clarify the buy CTA (S).** The sticky card always CTAs to `career-booster` even for a single course; make the Skill-Builder path the copy implies obvious. *Value: conversion clarity.*
- **Signature:** an **interactive certificate preview** with the learner's name field and a real verifiable-serial format — pride + proof, honest.

### 4.3 Packages — **8/10**
The money page is well-crafted: Recommended ring + "Best value," honest comparison table, "₹X more than Skill Builder" framing, correct compliance (no GST wording, "no hidden charges"), honest Founding-Batch scarcity (no fake countdowns).
- **Move reassurance to the decision point (S).** Secure-payment/refund marks sit in a row below both cards, not under each CTA. Put a compact `TrustTriad` at the button, per §14. *Value: conversion (CC-5).*
- **Signature:** an honest **"what changes when the founding batch closes"** micro-line (price returns to standard) — real urgency, no fabricated clock.

### 4.4 About — **7/10**
Cohesive and honest: real timeline, verbatim founder quote, monogram-only team (no AI faces — correct), confirmed marks only.
- **Show, don't tell (M).** Multiple prose sections against the "SHOW don't tell" rule; convert "the gap we exist to close" into a visual. *Value: engagement.*
- **Signature:** the 2035 "10 million skilled Indians" goal as a growing skill-map (reuse the Universe motif), zero fake numbers.

### 4.5 Webinar — **7/10**
Real scheduled session + live countdown, gcal link, honest agenda, no fabricated attendee counts. Solid.
- **Signature:** foreground the live host + "questions answered live" as the differentiator vs pre-recorded — trust through liveness.

### 4.6 FAQ / Blog / Videos — **FAQ 7 / Blog·Videos 6**
FAQ has search/filter + JSON-LD + real answers. Blog/Videos are honest coming-soon states that route to a live action (not dead ends). Appropriately calm — **do not over-invest.**

### 4.7 Marketing shell (header / footer / auth-shell) — **7/10**
Cohesive: glass sticky header (zero-JS mobile menu), scroll-progress hairline, premium footer with honest identity, split-screen auth-shell (gold-on-dark handled correctly). Live-verified premium split-screen login.
- **Add the brand mark to the header (S).** Header logo is plain text "GoSkilled" while the footer uses the `Monogram` — put the monogram in the header for a consistent signature. *Value: perceived quality (CC-5-adjacent).*

### Public cross-cutting
- **The fragmented trust triad (CC-5)** is the highest-ROI public consistency fix.
- **"Show don't tell"** — Home Why/Journey, About, and course outcomes lean on icon+heading+paragraph triplets; the system has the assets to make several visual.
- **Preserve the honesty** — Founding Batch, monograms, no fabricated counts, coming-soon-that-routes-to-action, the Living Skill Universe. These are genuine strengths; a redesign must not dilute them.

---

## 5. Auth / Onboarding + Admin

### 5.1 Auth / Onboarding — **7/10**
Login/register (split-screen AuthShell + shared segmented `OtpInput`) and the welcome medallion are genuinely premium — live-verified. The **money+activation flow is the weak link.**
- **Carry the premium frame + segmented OTP into checkout (S, high impact).** Checkout drops `AuthShell` for a bare card and enters the code via a plain `<Input maxLength=8>` while login/register got the segmented boxes — the *money moment* has the least-polished OTP entry in the product. *(DR-023 marks the checkout flow "unchanged"; confirm with founder before touching — but the inconsistency is real.)* *Value: trust · conversion · consistency (CC-5, frame continuity).*
- **Redesign the checkout success state (M).** On success it shows "Order created ✓" plus a raw `<code>{paymentOrderId}</code>` — a debug view exactly where the user just spent money. Make it a calm "zero-regret" confirmation (what they bought · amount · access unlocking · 48h refund) that hands off to welcome. *Value: trust · delight (Signature Moment #4).*
- **Promote the onboarding goal question to the hero (S–M).** The goal selector (Skill / Income / Both) is the "goal-based premium onboarding" flagship, but renders as a plain 3-button row under throwaway "Optional — helps us personalise" filler. Make it the identity-setting moment. *Value: delight · activation relevance.*
- **Signature:** make **checkout success → welcome** one continuous escalating "You're in the Founding Batch" celebration — the purchase-success screen as the opening beat that visually rhymes with the welcome medallion, instead of a raw order-ID between them.

### 5.2 Admin — **8/10 (trust ceremonies) / 6.5 (tables)**
Held to a Stripe-ops bar, the money/KYC surfaces are authoritative: server-recomputed withdrawal guards, typed-phrase payout ceremony, masked-PII-by-default with logged reveals, a calm decrypt-failure state. It does **not** need consumer flourish — it needs clarity, speed, confidence.
- **Unify the money tables (S–M).** `payments` and `users` bypass the shared `DataTable` and hand-roll their own `<table>` + `fmtDate`; money columns render in proportional numerals, left-aligned, so INR doesn't align. Migrate onto `DataTable` + give money columns `tabular-nums` + right-alignment (extend `.dc-number`). *Value: clarity · consistency · trust (CC-4).* Single highest ops-legibility fix.
- **Add sort + a couple of filters to the operational queues (M).** No column sorting anywhere; only `payments` filters. The Admin register's whole job is fast workflows. *Value: speed (scales with volume).*
- **Replace `window.confirm` on Mark PAID with a designed inline confirm (S).** Amount + holder + "already transferred via bank" checkbox — matching the payout-ceremony pattern, at the irreversible money action. *Value: trust · consistency.* (Pairs with W2 AD-2.)
- **Signature:** one **canonical dense, sortable, tabular money-table** applied to every financial screen (payments, withdrawals, wallets, rewards) so the whole ops surface reads as one authoritative ledger — the tables finally as engineered as the trust actions on top of them.

---

## 6. The Three Founder-Raised Items

### 6.1 JOURNEY BREAK — **confirmed, significant, fixable**
**Finding (verified in code).** Authenticated dashboard surfaces link *out* to public marketing routes, throwing a logged-in learner onto the marketing site — which renders `SiteHeader` with **Login / Register** CTAs, `SiteFooter`, marketing chrome, and loses the app shell, workspace theming, and session context. Confirmed crossings:

| From (in-app) | Links to (public) | Evidence |
|---|---|---|
| Learn sidebar **"Browse"** (a primary nav item) | `/courses` | `lib/nav/workspaces.ts:72` |
| Home hub Store / browse | `/courses` | `app/dashboard/home/page.tsx:68` |
| Home + Learn "Join webinar" | `/webinar` | `home/page.tsx:188,277`, `learn/page.tsx:299` |
| My Courses "discover more" | `/packages` | `app/dashboard/courses/page.tsx:55` |
| Progress upsell | `/packages` | `app/dashboard/progress/page.tsx:54` |
| Earn get-package | `/packages` | `app/dashboard/earn/page.tsx:84` |
| Player locked lesson | `/checkout?package=…` | `learn/[courseSlug]/page.tsx:106` |
| Account "Support" | `/contact` | `lib/nav/workspaces.ts:110` |

This is the founder's instinct, correct: a learner tapping **"Browse"** — a top-level Learn action — leaves the product. **Rationale it matters:** context/session/theming loss + being shown Login/Register while already logged in reads as a broken app and erodes the premium/trust impression exactly when the user is engaged; it also leaks the "two products" seam to the customer.

**Recommended direction.** Build an **in-app browse + course-detail experience** that lives under `/dashboard/*`, renders inside the shell (switcher + Learn theming + topbar), and reuses the existing catalog data + course-detail building blocks — so browsing, comparing, and starting checkout never drops the app frame. Keep the *public* `/courses` + `/packages` for logged-out acquisition; route *authenticated* CTAs to their in-app equivalents. Checkout can remain its own focused money surface (§5.1) but should be entered from within the app and return into it. **Impact:** high (usability · trust · retention). **Effort:** M–L (new in-app browse/detail routes + re-pointing ~8 CTAs; catalog/detail components largely exist). Sliceable: (a) in-app Browse index, (b) in-app course detail, (c) re-point CTAs + checkout return.

### 6.2 SESSION ROBUSTNESS — **solid, with one minor gap**
**Finding (verified).** Session handling is genuinely robust: middleware protects `/dashboard/*` and `/admin/*`, redirects unauthenticated users to `/login` with `?next=<pathname>` (return-to-page), **preserves auth cookies across the redirect** (`middleware.ts:21`) so refresh mid-session never drops the user, and admin-role failure bounces to home. `safeNext` (hardened in W2 against `//host` and `\` open-redirects) validates `next`, and `postAuthRedirect` honors it — new accounts → one-time `/welcome`, returning → Hub. Back/forward and refresh on protected routes behave correctly.
**The one gap:** the `next` capture uses `request.nextUrl.pathname` only, so a bounced deep link with a **query string is lost** on return (e.g. `/dashboard/learn/x?lesson=3` returns to the lesson but not the specific `?lesson=`). *Value: usability.* **Direction:** capture `pathname + search`; re-validate the full value in `safeNext`. **Effort: S.** No other session breaks found; this is a polish item, not a break.

### 6.3 NAV / IA — **the lock is genuinely good; keep it, with two refinements**
**Honest evaluation vs premium SaaS.** Nav v1.1 (thin switcher Home·Learn·Earn·Account + contextual sidebar, per-workspace theming, DR-040 recomposition, rail==bottom-bar) is well-conceived and well-built — live-verified as effortless, not bureaucratic. It solves the two-nav problem that plagues most learning apps and reads like an OS app-switcher. **I do not recommend a nav revision.** It clears the premium bar.

Two refinements *within* the lock (no spec change needed): the **triple-label redundancy** (§3.7 — let the sidebar header carry a workspace snapshot instead of repeating the label) and the **dead notification bell** (§3.7).

**On the founder's Home/sub-page-placement concern.** The one defensible tension is that **"Browse"** and **"Store"** currently sit as *Learn/Home* entries that leave the app (the §6.1 journey break). The right fix is not to move nav items but to make those destinations **in-app** (§6.1) — once Browse renders inside the shell, its placement under Learn is correct and the concern dissolves. If, after that, the founder still wants a dedicated discovery home, that would be an explicit **SPEC-CHANGE** (add a "Browse/Store" contextual page under Learn or a light Explore surface) — proposed here as an *option*, not a silent redesign: rationale = discovery deserves an in-app home; migration = new `/dashboard/learn/browse` route + re-pointed CTAs; impact = usability/retention. My recommendation is to fix the journey break first and re-evaluate; the nav *structure* itself should stay locked.

---

## 7. Prioritized Execution Backlog (sliced for Phase 2)

Ranked by impact ÷ effort. Each slice is **one reviewable unit**, touches a bounded set of files (so one builder owns it at a time, no overlap), and must land **after W1/W2 merge**, parked + reviewed + GATE (no self-merge, no deploy). Slices are ordered so foundational cross-cutting pieces (tokens, TrustTriad, `.dc-number`, Spark) land before the surfaces that consume them.

### Quick wins (S, high signal-per-effort — do first)
- **QW-1 · Home reorder + live greeting stake** (§3.1). Files: `home/page.tsx`, `lib/home/summary.ts`, `lib/greeting.ts`. *usability·engagement.*
- **QW-2 · "Overall progress %" → gauge** on Learn (§3.2, CC-3). Files: `learn/page.tsx`. *learning.*
- **QW-3 · Kill nav triple-label redundancy** (§3.7). Files: `components/nav/*`. *usability.*
- **QW-4 · Session: preserve query string in `next`** (§6.2). Files: `middleware.ts`, `lib/auth/post-auth.ts`. *usability.* (Coordinate — W2 already touched `post-auth.ts`; land after W2.)
- **QW-5 · Course-media placeholder variance** (CC-9). Files: `components/cards/course-card.tsx`. *usability.*
- **QW-6 · Packages: TrustTriad under each CTA** (§4.3). *conversion.*

### Cross-cutting foundations (build once — unblock the rest)
- **CF-1 · `TrustTriad` consolidation** (CC-5). One component + per-context slots; re-point public CTAs + Earn interiors. *trust·consistency.* **M.**
- **CF-2 · `.dc-number` + tabular money treatment** (CC-4) as a shared utility, adopted on admin tables and Earn interiors. *trust·usability.* **S–M.**
- **CF-3 · Spark connective mark** (CC-7) as reusable accent hooks (greeting bullet, ring endpoint, switcher pip, seal). *perceived quality·memorability.* **M.**
- **CF-4 · Rich zero-state primitive** (CC-6): retire flat `EmptyState` onto DecisionCard depth + illustration. *trust·first-run.* **M.**

### High-impact surfaces (the core of the elevation)
- **HS-1 · Course player re-skin + focus + momentum + ring-fills-as-you-watch** (§3.3, signature). The single highest-value slice. Files: `learn/[courseSlug]/page.tsx`, `components/dashboard/lesson-player.tsx`, consumes CF-3. *learning·retention·perceived quality.* **L** (slice into: a) token re-skin + ProgressRing header, b) focus treatment, c) completion-momentum + ring animation).
- **HS-2 · Wallet elevation onto DecisionCard + "clearing" stack + rich flag-off zero-state** (§ earn, signature). Files: `earn/wallet/page.tsx`, `components/affiliate/wallet-summary.tsx`, consumes CF-2/CF-4. *trust.* **M.**
- **HS-3 · KYC trust-forward form** (security header at the input · stepper · styled file inputs) (§ earn). Files: `components/affiliate/kyc-form.tsx`, `earn/kyc/page.tsx`. *trust·conversion.* **M.**
- **HS-4 · In-app Browse + Course Detail (journey-break fix)** (§6.1). New `/dashboard/learn/browse` + in-app detail; re-point ~8 CTAs. *usability·trust·retention.* **M–L** (slice a/b/c per §6.1).
- **HS-5 · Checkout premium frame + segmented OTP + success-as-celebration** (§5.1, signature). *conversion·trust.* **M** (confirm DR-023 with founder first).

### Consistency sweep (parallelizable, per-surface — the CC-1 vocabulary debt)
- **CS-1..n · Re-skin legacy dashboard components** onto the token vocabulary, one surface per slice (My Courses empty state, Commissions table, Network/Referrals, Leaderboard/Rewards, Learn stat-card depth), each consuming CF-2/CF-3/CF-4. *perceived quality·maintainability.* Each **S–M**; do as each surface is touched. Log any not-yet-done as `PRODUCT_DEBT.md` rows.

### Admin ops (lower consumer priority, real ops value)
- **AO-1 · Unify money tables onto `DataTable` + tabular money** (§5.2, CC-4). **S–M.**
- **AO-2 · Sort + filters on withdrawal/KYC queues** (§5.2). **M.**
- **AO-3 · Designed Mark-PAID confirm** (§5.2, pairs with W2 AD-2). **S.**

### Motion & shell polish
- **MP-1 · Level-1 route/workspace transition + ring-on-value-change hook** (CC-8, §3.7). **M.**
- **MP-2 · Notification bell → real panel or honest popover** (§3.7, W1 SC-1). **M.**

### Public depth (after the dashboard core)
- **PD-1 · Mobile hero: lead with a Universe teaser** (§4.1). **M.**
- **PD-2 · Per-course outcomes (kill boilerplate)** (§4.2). **M** (needs a content field — Layer-2/founder content).
- **PD-3 · Interactive certificate preview** (§4.2, signature). **M.**
- **PD-4 · Header monogram** (§4.7). **S.**

**Suggested Phase-2 sequence:** QW batch → CF foundations → HS-1 (player) → HS-2/HS-3 (money trust) → HS-4 (journey break) → HS-5 (checkout) → CS sweep in parallel → AO/MP/PD as capacity allows. Player, Wallet, and the journey break are the three that most change how the product *feels* and *earns trust* — they should anchor the first real Phase-2 waves.

---

### Closing note
GoSkilled does not need to be redesigned — it needs to be **finished to its own standard.** The system, the honesty discipline, and the signature ideas (DecisionCard, Spark, Living Skill Universe, the welcome medallion) are already better than most funded ed-tech. The gap is that the best ideas stop at the hub surfaces and the highest-value interiors — the player, the wallet, the KYC form — were left in an earlier vocabulary. Close that gap, extend the Spark as the connective thread, and unify trust into one language, and the product will feel premium *everywhere a user actually lives*, not just where they arrive.

*Phase 1 deliverable — plan only. No code changed. Awaiting founder approval to begin coordinated Phase-2 slices.*
