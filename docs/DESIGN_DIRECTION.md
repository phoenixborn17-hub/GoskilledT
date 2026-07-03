# GoSkilled vNext — Design Direction & Creative Vision

**Status:** DRAFT v0.1 (north-star for all UI/UX) · **Date:** 2026-07-03
**Author:** Claude (acting creative director / product designer / UX researcher) · **Owner:** Founder
**Maps to:** KB-07 Brand · KB-08 Website · KB-05 Product · KB-14 vNext ADR
**Principle (founder):** treat past docs/site as *references, not constraints*; every effect must have a purpose, improve usability, and strengthen the brand.

> **Goal:** not "another education website" — a memorable, premium, **AI-first** learning platform that feels timeless. But *world-class is defined by the user it serves*, not by how heavy it is.

---

## 1. The audience truth (this reframes everything)
GoSkilled's users are **Tier-2/3 India, mobile-first, budget Android, data-conscious, Hinglish-speaking**, and — because money is involved — **scam-wary**. Research (2026): heavy React-Three-Fiber/3D routinely crashes or blanks on low-end mobile; premium sites now hit LCP < 2.5s and design mobile-first at 320–375px.

**So the "wow" strategy is inverted from the usual desktop-3D playbook:**
> **Premium = fast, mobile-first, effortless, and trustworthy — with a few surgical immersive moments — NOT heavy 3D everywhere.** For this audience, a site that loads in 1.5s on a ₹9k phone and *feels* crafted is more "unforgettable" than a 3D showcase that stutters. Craft > spectacle.

This is the single most important design decision. Everything below serves it.

## 2. Brand feeling
Premium, confident, warm, trustworthy, aspirational-yet-attainable. "Making Potential Visible" · "Seekho. Badho. Kamao." Visual mood: clean depth + green/gold light, generous space, expressive Hinglish-friendly type, motion that feels *inevitable*. Every screen should signal: *this is legit, this is for me, I can do this.*

## 3. Design language
- **Typography** — Sora (display, expressive large sizes) + Inter (body) + Noto Sans Devanagari (Hindi). Big, confident headings; strong hierarchy; Hinglish-tested line-heights.
- **Color & depth** — green `#137E49` (LMS/marketing), gold `#EDC825` (affiliate), charcoal, off-white. **Refined glassmorphism used *intentionally*** — for nav, floating cards, modals — as a depth-hierarchy tool, not decoration (accessible contrast, careful blur radii). Soft lighting/gradient-mesh accents. Dark mode first-class.
- **Motion** — hardware-accelerated CSS + Intersection Observer (not heavy JS); scroll-reveals that *clarify* content; page/route transitions via the View Transitions API; micro-interactions on every primary action. **Always respect `prefers-reduced-motion`; motion never blocks content.**
- **Immersive/3D** — reserve for **one or two hero moments**, lazy-loaded, `OffscreenCanvas`/worker where possible, with a **static/Lottie fallback** on mobile/low-end (feature-detect + graceful degradation). Never load-bearing.
- **Illustration** — a warm, original illustration/icon set (Indian, aspirational) beats stock 3D for brand memorability and weight.

## 4. Signature experiences (each with a purpose)
1. **Homepage = the Learn→Earn scroll-story.** GoSkilled's unique wedge told as a cinematic scroll: *skill → certificate → earn*. Purpose: instantly communicate the model + build trust. (CSS/IO scroll, not 3D-heavy.)
2. **Goal-based premium onboarding.** First question: *"Why are you here — a skill, income, or both?"* → sets the adaptive path + personalizes the dashboard. Purpose: relevance from second one; higher activation.
3. **AI Hinglish Tutor ("Guru") — the AI-first signature.** An in-course companion that answers doubts, explains, and quizzes **in Hindi/Hinglish**. Purpose: removes the English barrier that blocks Tier-2/3 learners; drives completion. On-brand (AI-first) and buildable on the Master AI Brain (§23). *This is the real "wow" — useful, not gimmick.*
4. **Course player + adaptive path.** Not just video: interactive checkpoints, "try-it" tasks (esp. AI/DM courses), progress ring, resume. Purpose: completion (research: AI-adaptive/gamified → 91% vs 20%).
5. **Modern dashboards** — LMS (green): continue-learning, streaks, milestones. Affiliate (gold): transparent earnings, an elegant referral-network view, payout status. Purpose: motivation + trust; gamified but never manipulative.
6. **Micro-interactions + delightful loading** — branded skeletons, purposeful success moments (e.g., enrollment/first-lesson), tasteful haptic-like feedback. Purpose: perceived speed + delight.

## 5. Feature rethink (first-principles — challenge, propose, redesign)
| Feature | Decision | Why |
|---|---|---|
| **AI Hinglish Tutor** | **Add (flagship)** | Biggest outcome + differentiation lever for the audience; AI-first. |
| **Adaptive learning paths** | Add | Personalized sequence by goal/pace → completion + relevance. |
| **Interactive practice (quizzes/tasks)** | Add | Passive video ≠ skill; practice builds real capability + proof. |
| **Gamification (streaks/XP/milestones)** | Add (ethical) | Drives completion; tie to the "earn" motivation; avoid dark patterns (wellbeing). |
| **WhatsApp-first layer** | **Add** | India's default channel — onboarding, nudges, community, support, even lesson reminders. High-ROI, currently missing. |
| **PWA + low-data / offline lessons** | Add | Installable, caches lessons, data-saver — essential for the audience. |
| **Vernacular / Hindi toggle** | Add | Language is the real barrier, not motivation. |
| **Shareable credential / public profile** | Add | Social proof + a natural, compliant affiliate driver. |
| **Trust & credibility layer** | **Add (principle)** | Money product in a scam-heavy market → radical transparency, real proof, honest pricing, zero dark patterns, no income guarantees (D-29). |
| **Affiliate experience redesign** | Redesign | Make earning transparent + gamified (gold), compliant, gated by D-01. |
| Heavy 3D showcases | **Cut / minimize** | Fails the audience + solo-maintainability + performance. |

Launch set (with the website slice): homepage scroll-story, onboarding, course player, dashboards, trust layer, WhatsApp + PWA basics. Tutor/adaptive/gamification depth and immersive hero can phase in fast-follow.

## 6. Budgets & guardrails (non-negotiable)
- **Mobile-first** (design at 320–375px up). **LCP < 2.5s** on mid-tier Android/4G; JS kept lean.
- **Accessibility WCAG AA** (shadcn/Radix base), `prefers-reduced-motion`, keyboard + screen-reader.
- **Every animation earns its place** — if it doesn't clarify, guide, reward, or brand, cut it.
- **Data-light** — image/video optimization, lazy media, data-saver mode.

## 7. Buildable by a solo founder + Claude Code
Achieve all of the above with a **maintainable, AI-legible** stack: **shadcn/ui** (accessible base) + **Tailwind tokens** (green/gold) + **Framer Motion + CSS** for 99% of motion + **View Transitions API** for page flow + **Lottie** for hero delight + **R3F only for one lazy, fallback-guarded hero**. Component-driven, documented in this file so Claude Code builds consistently. Premium through *system + craft*, not bespoke fragility.

## 8. North-star test
Every screen: **(1)** loads fast on a cheap phone, **(2)** a first-time Tier-3 user instantly understands *skill → certificate → earn* and trusts it, **(3)** one small moment of delight, **(4)** every effect has a job. If yes → it's world-class *for GoSkilled*.
