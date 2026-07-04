# GoSkilled — Design Direction v1.0 (THE DESIGN CONSTITUTION)

**Status:** ❄️ **FROZEN v1.0** — founder-approved 2026-07-05 (line-by-line review + 10 final observations incorporated). Evolves only via changelog + founder approval; do not touch absent a major learning or product-direction change. · **Date:** 2026-07-05
**Author:** Claude (creative director) · **Owner:** Founder · **Maps to:** KB-07 Brand · KB-08 Website · DR-031
**Structure:** **Part A** (§1–§8, unchanged from v0.1) = the audience truth + strategy — it **wins every conflict**. **Part B** (§9+) = the enforceable World-Class Standard every surface is reviewed against.
**Rule (DR-031):** a page is never "complete" — it either *meets Design Direction v1.0* or it doesn't. "Works" ≠ done.
**Principle (founder):** treat past docs/site as _references, not constraints_; every effect must have a purpose, improve usability, and strengthen the brand.

---
# PART A — North-star (v0.1, unchanged)

> **Goal:** not "another education website" — a memorable, premium, **AI-first** learning platform that feels timeless. But _world-class is defined by the user it serves_, not by how heavy it is.

---

## 1. The audience truth (this reframes everything)

GoSkilled's users are **Tier-2/3 India, mobile-first, budget Android, data-conscious, Hinglish-speaking**, and — because money is involved — **scam-wary**. Research (2026): heavy React-Three-Fiber/3D routinely crashes or blanks on low-end mobile; premium sites now hit LCP < 2.5s and design mobile-first at 320–375px.

**So the "wow" strategy is inverted from the usual desktop-3D playbook:**

> **Premium = fast, mobile-first, effortless, and trustworthy — with a few surgical immersive moments — NOT heavy 3D everywhere.** For this audience, a site that loads in 1.5s on a ₹9k phone and _feels_ crafted is more "unforgettable" than a 3D showcase that stutters. Craft > spectacle.

This is the single most important design decision. Everything below serves it.

## 2. Brand feeling

Premium, confident, warm, trustworthy, aspirational-yet-attainable. "Making Potential Visible" · "Seekho. Badho. Kamao." Visual mood: clean depth + green/gold light, generous space, expressive Hinglish-friendly type, motion that feels _inevitable_. Every screen should signal: _this is legit, this is for me, I can do this._

## 3. Design language

- **Typography** — Sora (display, expressive large sizes) + Inter (body) + Noto Sans Devanagari (Hindi). Big, confident headings; strong hierarchy; Hinglish-tested line-heights.
- **Color & depth** — green `#137E49` (LMS/marketing), gold `#EDC825` (affiliate), charcoal, off-white. **Refined glassmorphism used _intentionally_** — for nav, floating cards, modals — as a depth-hierarchy tool, not decoration (accessible contrast, careful blur radii). Soft lighting/gradient-mesh accents. Dark mode first-class.
- **Motion** — hardware-accelerated CSS + Intersection Observer (not heavy JS); scroll-reveals that _clarify_ content; page/route transitions via the View Transitions API; micro-interactions on every primary action. **Always respect `prefers-reduced-motion`; motion never blocks content.**
- **Immersive/3D** — reserve for **one or two hero moments**, lazy-loaded, `OffscreenCanvas`/worker where possible, with a **static/Lottie fallback** on mobile/low-end (feature-detect + graceful degradation). Never load-bearing.
- **Illustration** — a warm, original illustration/icon set (Indian, aspirational) beats stock 3D for brand memorability and weight.

## 4. Signature experiences (each with a purpose)

1. **Homepage = the Learn→Earn scroll-story.** GoSkilled's unique wedge told as a cinematic scroll: _skill → certificate → earn_. Purpose: instantly communicate the model + build trust. (CSS/IO scroll, not 3D-heavy.)
2. **Goal-based premium onboarding.** First question: _"Why are you here — a skill, income, or both?"_ → sets the adaptive path + personalizes the dashboard. Purpose: relevance from second one; higher activation.
3. **AI Hinglish Tutor ("Guru") — the AI-first signature.** An in-course companion that answers doubts, explains, and quizzes **in Hindi/Hinglish**. Purpose: removes the English barrier that blocks Tier-2/3 learners; drives completion. On-brand (AI-first) and buildable on the Master AI Brain (§23). _This is the real "wow" — useful, not gimmick._
4. **Course player + adaptive path.** Not just video: interactive checkpoints, "try-it" tasks (esp. AI/DM courses), progress ring, resume. Purpose: completion (research: AI-adaptive/gamified → 91% vs 20%).
5. **Modern dashboards** — LMS (green): continue-learning, streaks, milestones. Affiliate (gold): transparent earnings, an elegant referral-network view, payout status. Purpose: motivation + trust; gamified but never manipulative.
6. **Micro-interactions + delightful loading** — branded skeletons, purposeful success moments (e.g., enrollment/first-lesson), tasteful haptic-like feedback. Purpose: perceived speed + delight.

## 5. Feature rethink (first-principles — challenge, propose, redesign)

| Feature                                   | Decision            | Why                                                                                                                                       |
| ----------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Hinglish Tutor**                     | **Add (flagship)**  | Biggest outcome + differentiation lever for the audience; AI-first.                                                                       |
| **Adaptive learning paths**               | Add                 | Personalized sequence by goal/pace → completion + relevance.                                                                              |
| **Interactive practice (quizzes/tasks)**  | Add                 | Passive video ≠ skill; practice builds real capability + proof.                                                                           |
| **Gamification (streaks/XP/milestones)**  | Add (ethical)       | Drives completion; tie to the "earn" motivation; avoid dark patterns (wellbeing).                                                         |
| **WhatsApp-first layer**                  | **Add**             | India's default channel — onboarding, nudges, community, support, even lesson reminders. High-ROI, currently missing.                     |
| **PWA + low-data / offline lessons**      | Add                 | Installable, caches lessons, data-saver — essential for the audience.                                                                     |
| **Vernacular / Hindi toggle**             | Add                 | Language is the real barrier, not motivation.                                                                                             |
| **Shareable credential / public profile** | Add                 | Social proof + a natural, compliant affiliate driver.                                                                                     |
| **Trust & credibility layer**             | **Add (principle)** | Money product in a scam-heavy market → radical transparency, real proof, honest pricing, zero dark patterns, no income guarantees (D-29). |
| **Affiliate experience redesign**         | Redesign            | Make earning transparent + gamified (gold), compliant, gated by D-01.                                                                     |
| Heavy 3D showcases                        | **Cut / minimize**  | Fails the audience + solo-maintainability + performance.                                                                                  |

Launch set (with the website slice): homepage scroll-story, onboarding, course player, dashboards, trust layer, WhatsApp + PWA basics. Tutor/adaptive/gamification depth and immersive hero can phase in fast-follow.

## 6. Budgets & guardrails (non-negotiable)

- **Mobile-first** (design at 320–375px up). **LCP < 2.5s** on mid-tier Android/4G; JS kept lean.
- **Accessibility WCAG AA** (shadcn/Radix base), `prefers-reduced-motion`, keyboard + screen-reader.
- **Every animation earns its place** — if it doesn't clarify, guide, reward, or brand, cut it.
- **Data-light** — image/video optimization, lazy media, data-saver mode.

## 7. Buildable by a solo founder + Claude Code

Achieve all of the above with a **maintainable, AI-legible** stack: **shadcn/ui** (accessible base) + **Tailwind tokens** (green/gold) + **Framer Motion + CSS** for 99% of motion + **View Transitions API** for page flow + **Lottie** for hero delight + **R3F only for one lazy, fallback-guarded hero**. Component-driven, documented in this file so Claude Code builds consistently. Premium through _system + craft_, not bespoke fragility.

## 8. North-star test

Every screen: **(1)** loads fast on a cheap phone, **(2)** a first-time Tier-3 user instantly understands _skill → certificate → earn_ and trusts it, **(3)** one small moment of delight, **(4)** every effect has a job. If yes → it's world-class _for GoSkilled_.

---
# PART B — World-Class Standard (v1.0 · DR-031 · enforceable review checklist)

> **World-class ≠ fancy, ≠ animations everywhere, ≠ 3D everywhere. World-class = every interaction has quality-feel, and the user's first thought is "ye company serious hai."** Premium UI (looks premium) AND world-class product (feels premium to use) — both, always. Our bar = **reference quality standards, never visual copying** — the craft level of the world's best product teams (examples only: Apple, Stripe, Linear, Vercel, Framer, Raycast, Arc, Notion, Duolingo); the principle stands on its own, not on any external brand. **When any rule below conflicts with Part A, Part A wins.**

## THE GOLDEN RULE (the soul of this document)

> **Every design decision must improve at least one of five outcomes: TRUST · CLARITY · CONVERSION · DELIGHT · PERFORMANCE. If it improves none of them, it doesn't belong in the product.**

## SHOW, DON'T TELL (the founder rule)

> **Whenever possible, SHOW instead of TELL.** Design should reduce reading, not increase it. Before writing three paragraphs, ask: *can this be explained visually — illustration, real UI, diagram, motion?* Our audience consumes visuals faster than text; every section that can become visual storytelling, should.

## SIGNATURE MOMENTS — "Users remember moments, not pages."

The objective is NOT to make every page equally beautiful — it is to create a handful of **unforgettable flagship moments**, engineered to be remembered and retold:
1. **Homepage Hero** (first impression) · 2. **Registration Welcome** (belonging) · 3. **First Lesson complete** (the first win, <2 min) · 4. **Purchase Success** (zero-regret celebration) · 5. **Certificate Earned** (pride) · 6. **Referral Milestone** (pre-D-01: invite-count celebration only — zero earnings framing, D-29).
These six get disproportionate design investment (Level-2/3 motion budget concentrates here). Everything else follows the standard rules calmly.

## First principle — Premium ≠ Beautiful

Premium is not "beautiful UI". Premium = **fast · predictable · trustworthy · elegant · consistent · simple** — in that spirit. A beautiful screen that is slow, surprising, or inconsistent is not premium; a plain screen that is instant, obvious, and honest often is.

## THE EMOTIONAL BENCHMARK — Aspirational Premium (founder clarification, 2026-07-05)

**We design for our audience, not for designers.** Apple/Stripe/Linear are our QUALITY references, not our EMOTIONAL benchmark. Our users — students, fresh graduates, young professionals, aspirational Tier-2/3 families, first-time online learners chasing skills and income — are **emotional, aspirational, and highly visual**. Ultra-minimal SaaS coldness reads as *empty* to them, not premium. We are not building a minimal dashboard; we are building an **aspirational learning ecosystem**.

**The Aspirational Premium balance (every surface holds all five):** rich but never cluttered · modern but never confusing · premium but never cold · exciting but never distracting · beautiful but always functional.

**Emotional goal — the first-open feeling:** *"Ye premium platform hai. Modern, trustworthy, exciting, full of opportunities. Main explore karna chahta hoon."* That emotional response is a design requirement equal to usability.

**Design Personality by Context — THREE registers (the enforcement rule; founder-defined 2026-07-05):**

| Register | Surfaces | Emotional goal | Design vocabulary |
|---|---|---|---|
| **1. Consumer** (inspire + motivate) | Home · courses · webinar · about · **login/register/welcome** · Dashboard Home · learning experience · earn (invite side) · AI Mentor · community/career (future) | **Warm · aspirational · rich · inspiring · modern · premium · energetic** — "I want to become part of this platform" | Beautiful compositions · premium illustration · crafted motion · layered layouts · rich-but-clean · hero experiences · tasteful depth · strategic 3D (within §11 budget) · elegant micro-interactions |
| **2. Trust & Transaction** (reassure) | Checkout · payments · wallet · payouts/withdrawals · KYC · **certificate verify** · account settings · security | **Calm · safe · professional · transparent · trustworthy** — reduce anxiety, never add excitement; user always feels in control | Clarity · readability · predictability · strong hierarchy · clear feedback · honest information · minimal distraction · subtle functional motion only |
| **3. Admin** (empower) | Entire `/admin` workspace | **Focused · efficient · powerful · reliable** — capable, not decorative | Fast workflows · information density · clear tables · meaningful charts · excellent filtering · keyboard-friendly · consistent components; no decorative effects |

*Nuance:* the certificate **earning moment** (inside LMS) is Register 1 — earned celebration; the certificate **verify page** is Register 2 — calm proof.

**One product, multiple emotional states:** marketing inspires · learning motivates · finance reassures · administration empowers. Tokens, typography, spacing, components, and voice stay ONE system across all three registers (Consistency Test still applies product-wide) — only the emotional tone changes with the user's task. Premium = every page feeling exactly right for its purpose, not every page looking identical.

**Visual-richness rule:** if a page feels weak, do NOT add features — strengthen layout, composition, imagery, illustration, motion-guided attention, hierarchy. Presentation before functionality.

**Per-surface notes:** *Hero sections* = emotional wow via visual storytelling (illustration, layers, gradient mesh, light/depth, floating UI compositions, scroll animation — 3D only within the §11 budget; performance + clarity stay top priorities). *Login/Register* = brand moments, never bare utility forms — form stays the focus, the page reinforces the ecosystem (illustration side, motivational line, trust indicators, subtle background motion). *Dashboards* = alive without fake data — rich hierarchy, elegant real-data charts, beautiful empty states. *Marketing pages* = inspire through imagery/composition/story, not text walls.

**Boundaries unchanged:** Part A performance/mobile budgets win every conflict · D-29 floor (aspiration ≠ income promises) · motion tiers (§10) · the ONE immersive-3D slot (§11) · Golden Rule applies to every richness decision.

## Second principle — Every page has an emotional job

Before any design decision, answer: *what should the user FEEL here?* Canonical map (extend per-page in module specs, never skip):

| Surface | Feel |
|---|---|
| Home | Inspiration + trust |
| Courses / detail | Confidence ("main ye kar sakta hoon") |
| Packages / checkout | Safety + zero regret |
| Earn / affiliate | Opportunity, honestly framed |
| Dashboard / LMS | Progress, momentum |
| Certificates / verify | Pride + proof |
| Admin | Control, calm |
| Settings / profile | Safety |

## 9. Visual design rules
- **Typography:** Sora display / Inter body / Noto Devanagari (DR-012). Type scale is a token set — no ad-hoc sizes. Big confident headings; measure 60–75ch; Hinglish-tested line-heights; no orphan single-word lines in heroes.
- **Spacing & density (visual rhythm):** 4px-base scale only; generous whitespace is a feature; **every screen holds a clear visual rhythm — never empty, never overloaded**; consistent section rhythm per page; nothing "almost aligned" — grid or nothing.
- **Visual hierarchy (four layers, every page):** **Primary** (the one thing this page exists for) → **Secondary** (supporting actions/info) → **Supporting** (context, trust, detail) → **Decorative** (atmosphere — smallest layer, first to cut). If a viewer can't identify the Primary layer in 3 seconds, the hierarchy has failed.
- **Radius/shadow/elevation:** one token ramp each, used consistently; glass (blur) ONLY for nav/modals/floating cards as depth hierarchy (Part A §3), never decoration; shadows soft and physical, never muddy.
- **Iconography:** lucide only, one stroke-weight, optically aligned; no emoji-as-icon in product UI.
- **Imagery:** **never generic stock photos** — they make the product feel cheap. Allowed: custom illustrations · real product UI · brand graphics · genuinely high-quality lifestyle imagery (real, relevant, Indian). When in doubt, illustrate.
- **Illustration system (brand asset):** one custom, original, warm **Indian** illustration set covering the brand's five themes — learning · career · AI · earning (D-29-safe) · growth. Consistent style across all surfaces; these become owned brand assets, not decorations.
- **Consistency:** same element = same look everywhere. A button/badge/table that differs between pages is a defect.

## 10. Motion design rules (with hierarchy)
The best animation is one the user doesn't consciously notice. Motion is tiered — the tier decides where it's owed:
- **Level 1 — MANDATORY on every interactive surface:** hover/press states · focus rings · loading (skeleton→content) · success/error state changes · page/route transitions. Their absence is a defect.
- **Level 2 — RECOMMENDED where they clarify:** scroll-reveals · number count-up (real data only) · chart draw-in · progress-ring fill.
- **Level 3 — SPECIAL, budgeted, never default:** hero moments · immersive scenes · the ONE 3D slot (§11) · interactive showcases. Requires explicit justification per surface; never on every page.
Anything outside these tiers must justify itself against Part A §3 + the Golden Rule. Durations 150–350ms UI / ≤700ms reveals; standard easing; ALWAYS `prefers-reduced-motion`; motion never blocks input or shifts layout (CLS 0).

## 11. Hero rules (memorable ≠ heavy)
**A hero has five jobs, in order: stop the scroll → explain the value → create aspiration → build trust → drive the CTA.** A beautiful hero that doesn't convert has failed; a converting hero that feels cheap has also failed — heroes are conversion surfaces AND brand moments simultaneously.
Every major marketing hero (Home · Courses · Packages · Earn · About · Webinar) must be an *experience*, not a headline block: motion typography, gradient-mesh light, original illustration, scroll-story, or interactive-lite moments — **crafted with CSS/Lottie/IO, not 3D-by-default**. The Part A budget stands: **≤1 truly immersive (R3F) hero in the whole product**, lazy, static/Lottie fallback, only after LCP headroom is proven. Candidate surfaces for that ONE slot (choose later, data-gated): Home or the AI/Guru surface. Certificates/learning-journey get *illustration-grade* moments, not WebGL.

## 12. Card rules
No two card *types* should feel identical in importance. Cards must be context-aware: course cards carry progress/preview affordance; stat cards carry trend + count-up; wallet cards carry state (held/available) visually distinct; hover = lift + subtle glow (desktop), press-state on mobile; interactive cards are OBVIOUSLY interactive (cursor, affordance), static ones obviously not. Mini-charts/sparklines welcome where real data exists — never decorative fake graphs (D-29).

## 13. Dashboard rules (alive, not noisy)
**Every dashboard — every screen of it — must answer one question first: "What should I do next?"** If the user has to figure that out themselves, the dashboard has failed regardless of how alive it looks.
Dashboards must feel alive on real data only: animated progress rings · chart draw-ins · activity timeline · hover insights (tooltip depth) · count-up numbers · wallet/earnings transitions between states. If the account is new, ALIVE means a beautiful zero-state (see §15), never fake liveliness. Heatmaps/achievements land with GPS-M5 gamification — not before (scope freeze).

## 14. Trust design rules (the most underrated pillar)
Trust has a UI. Trust elements use the design system (not stock badge PNGs), appear at decision moments, and never crowd the CTA. Vocabulary: secure-payment mark · GST-inclusive price line · 48h-refund chip · verified-certificate mark · founding-team presence · company registration line (EDZERA LLP) · transparent calculation · "no income guarantees" stated with pride.
**Trust hierarchy (enforceable): every important page carries ≥3 trust signals, chosen for that page's decision:**

| Page | Minimum trust set |
|---|---|
| Home | Company identity · GST-inclusive pricing · verified certificate |
| Packages/Checkout | Secure payment · 48h refund · GST-inclusive |
| Earn/affiliate | Programme policy status · transparent calculation (ledger-backed) · audited payouts |
| Dashboard/LMS | Real progress · certificate path · verified marks |
| Verify | Serial + issue date · anti-fake framing · company identity |

## 15. Empty/loading/success/error state rules
- **Empty:** every empty state = illustration/visual + one warm Hinglish-friendly line + ONE clear CTA + subtle entrance motion. "No courses yet" is banned copy; "Start your first lesson — 2 minutes" is the bar.
- **Loading:** branded skeletons that match final layout exactly (zero CLS); shimmer subtle; skeleton→content is a designed transition. Spinners only where skeletons are impossible.
- **Success:** every meaningful completion gets a designed moment (check-draw, confetti where earned — purchase, certificate, Lesson 0); tone = celebration proportional to achievement.
- **Error:** never dead-ends — what happened (plain language) + what to do next + retry affordance; blame the system, never the user; visually calm (no red walls).

## 16. Copy rules (voice is part of design)
Warm, direct, Hinglish-friendly; second person; zero jargon; honesty as style (D-29 as brand); buttons = verbs ("Start learning", never "Submit"); numbers concrete, promises none. Microcopy is designed, not filled in. **Design should reduce reading, not increase it** — if a visual can carry the meaning (SHOW, don't tell), the paragraph gets cut.

## 17. Performance & feel rules
60fps interactions (transform/opacity only for animation) · zero CLS · LCP < 2.5s mid-Android (Part A budget) · instant-feel taps (optimistic UI where safe, ≤100ms feedback always) · route transitions mask fetches · images sized+lazy · JS lean. **Performance IS premium** — a stutter cancels every polish rule above.

## 18. Mobile & a11y (restated as review items)
320px-first pixel-perfection · thumb-reachable primary CTAs · bottom-nav ergonomics · WCAG AA + gold-contrast rule · keyboard + screen-reader on every interactive element · touch targets ≥44px. Cursor-dependent delight = desktop-enhancement only, never required for the experience.

## 19. The review ritual (how this document is enforced)
Every surface, before it's called done, is scored against: **Golden Rule + both first principles · Visual (§9) · Motion tiers (§10) · Hero (§11, marketing) · Cards (§12) · Dashboard (§13, app) · Trust hierarchy ≥3 (§14) · States (§15) · Copy (§16) · Performance (§17) · Mobile/A11y (§18)** — plus the Part A §8 north-star test, plus:
**The Consistency Test (final gate):** the new page is compared against ALREADY-BUILT pages, not against itself. Same elements identical, same rhythm, same voice. *If it could pass as a different project's page — REJECT, regardless of how good it looks alone.* Verdict language: *"meets Design Direction v1.0"* or a PRODUCT_DEBT row per gap. **Sequencing (founder directive 2026-07-05):** new modules are built to this standard from the first commit; already-closed modules are NOT revisited mid-sprint — gaps go to PRODUCT_DEBT.md, and dedicated **Product Polish Sprints** upgrade every existing page to this bar after the core roadmap (through GPS-M5) is complete.
