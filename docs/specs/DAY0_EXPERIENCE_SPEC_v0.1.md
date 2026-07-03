# Day-0 Experience Spec — Registration → First Session (v1.0 FROZEN)

**Status:** **FROZEN v1.0** — founder-approved 2026-07-04 (DR-030 LOCKED in Decision Register). GPS-M2 delta in effect; implementation may proceed per DR-027.
**Scope:** everything a new user experiences from "Register Free" to the end of their first session, plus the Dashboard Hub shell all dashboard phases plug into.
**Explicitly unchanged:** checkout flow (DR-023 — OTP-inside-checkout untouched) · auth backend (Supabase OTP, `syncUser`) · money rules · D-29.
**Governed by:** DR-029 (uncertain values = config slots, registered in LAUNCH_CONFIG.md).

---

## 1. Principles (agreed 2026-07-03)

1. OTP-only auth forever. No passwords, no forgot-password — ever.
2. Registration decoupled from purchase. Account = free, purchase = later.
3. No mandatory gates. Onboarding is guided, never forced (mandatory video rejected; replaced by Lesson 0 + checklist).
4. Webinar = one opportunity among many, never a prerequisite.
5. Every user gets a referral link at signup. Link ≠ earning eligibility; pre-D-01 copy = invite-only framing, zero earn language.
6. Truthful always: no fake data anywhere; locked ≠ fake; coming-soon labeled honestly.
7. First win in under 2 minutes: Lesson 0 completion is the activation event.

## 2. Routes & navigation changes

| Route | Change | Notes |
|---|---|---|
| `/register` | NEW | Public. Phone → OTP → account. Fields: phone (required) + name (optional, single field, "aap kya sunna pasand karoge?" tone). Email NOT asked here (kept for profile/onboarding — one less field). |
| `/login` | UNCHANGED mechanically | Copy sharpened: "Welcome back". Cross-links: "New here? Register free". `?ref=` capture added (same as register). |
| `/welcome` | NEW | Post-registration one-time moment (§4). Auth-gated; skippable; never shown again after completion/skip (User flag). |
| `/dashboard` | REDESIGNED → Dashboard Hub (§6) | Replaces LMS-only dashboard concept as the landing surface. |
| Public nav | ADD "Register Free" (primary) + "Login" (secondary) | Blueprint v1.1 nav amendment — part of DR-030. Marketing pages CTAs may point to `/register` where "start free" contextually fits (copy slots). |
| Bottom nav (dashboard, mobile) | Home · Learn · Earn · Profile | Hub = Home tab. |

`?ref=CODE` capture on `/register`, `/login`, and marketing pages → persisted (cookie, 30-day, first-touch wins — **OPEN-2**) → passed to `syncUser` (existing attribution logic; self-referral already blocked).

## 3. Registration flow (`/register`)

Purpose: zero-friction account creation. CTA: "Create free account".
Steps: phone → OTP (segmented input — shared component from OTP UX debt item) → account created (`syncUser`, referralCode auto-generated — existing) → redirect `/welcome`.
States: invalid phone · wrong OTP · resend timer · rate-limited · already-registered (auto-login, skip `/welcome` if previously completed).
A11y: same standard as login (Lighthouse 100). SEO: indexable, minimal; `Register free — GoSkilled` (copy slot).
Analytics events: `register_started`, `otp_verified`, `account_created` (+ `ref_attributed` when refCode present).

## 4. Welcome moment (`/welcome`, one-time)

Full-screen, single-purpose. Content:
1. "Welcome to GoSkilled, {name|friend} 👋 — You're part of the Founding Batch." (Founding Batch = honest framing, D-29.)
2. If name not captured at register: one optional name field inline ("What should we call you?") — skippable.
3. ONE primary button: **"Start your first lesson (2 min)"** → Lesson 0 in the LMS player.
4. Quiet secondary: "Skip to dashboard".

No carousel, no multi-step tour, no feature list. Completion/skip sets `User.welcomeSeenAt` (schema: one nullable timestamp — Tier-A review at build).
Analytics: `welcome_viewed`, `lesson0_started`, `welcome_skipped`.

## 5. Lesson 0 — "GoSkilled kaise kaam karta hai"

The onboarding video AS a real lesson in the real LMS player (course: hidden "Getting Started" system course, auto-enrolled at registration).
- Content (CONTENT slot, founder recording, 60–90s + optional chapters): what GoSkilled is · how learning works · what unlocks with purchase · invite-a-friend mention (compliant copy) · next steps.
- Completing it = first progress checkmark + purposeful-delight moment (existing confetti pattern) + checklist item 1 done.
- Skippable at all times; never blocks anything. Watch-tracking = existing `LessonProgress` (no new machinery, no 90% enforcement).
- Free-preview delivery (YouTube-unlisted allowed per DR-022) until Stream is live.
Analytics: `lesson_complete` (existing event; Lesson 0 identifiable by course slug).

## 6. Dashboard Hub (`/dashboard`)

Layout (mobile-first 320px; vertical stack; desktop = 2-col grid):

1. **Header:** "Namaste {name}" + goal chip (from onboarding data if present) + Founding Batch badge.
2. **Get Started checklist (0/4):** Complete Lesson 0 · Watch a course preview · Book a webinar seat · Invite 2 friends. Progress persists (`ChecklistState` — simple JSON column on User or tiny table; Tier-A call at build). Dismissible after completion; auto-hides at 4/4 with a completion moment.
3. **Continue card (hero):** always a resume action — Lesson 0 → last preview → (post-purchase) current course lesson. Never static, never empty.
4. **Learn card:** both launch courses with full syllabus visible + first lesson of each playable free + sample certificate image (real template — depends LAUNCH_CONFIG #14). Locked lessons show lock + honest unlock line. Persistent quiet CTA: "Unlock all {n} lessons + certificate" → `/packages`. No countdowns, no scarcity.
5. **Earn card:** referral link + one-tap WhatsApp share. Pre-D-01 copy (slot, LAUNCH_CONFIG #17): "Invite friends who want to learn" + "Rewards programme launching after review — invited friends stay linked to you." Real invite count shown (truthful data; zero-state: "0 invites yet — share your link"). NO earnings numbers, no blurred previews, no ₹ anywhere pre-D-01.
6. **Webinar card:** next session + one-tap booking (schedule = LAUNCH_CONFIG #27; zero-state: "Sessions announced soon"). Independent of purchase.
7. **AI Mentor card:** labeled "Coming soon" + one honest line (Hinglish tutor). Non-interactive.
8. **Profile (bottom nav):** existing page + Founding Batch badge + referral code display.

Empty-dashboard rule: **no card ever renders blank** — every card has designed zero/locked/coming-soon states (states are Layer-1 engineering, complete at build).

## 7. Day-1+ return experience

- Hub hero = resume (the return anchor). Checklist persists until done.
- Webinar booking (if any) surfaces countdown on webinar card — real dates only.
- Nudges (email/WhatsApp) = Phase 5 / LAUNCH_CONFIG later; nothing built now beyond opt-in slot on profile (**OPEN-3**).
- No streaks/XP/gamification in this spec (deliberately Phase 5).

## 8. Compliance rails (non-configurable)

- D-29: no income language anywhere in Day-0 surfaces, including placeholders. Earn card copy sets are counsel-reviewed before launch (both pre- and post-D-01 sets).
- No fake data: invite counts, progress, webinar dates — real or designed zero-states only.
- Gold contrast rule, `prefers-reduced-motion`, WCAG AA — as per DESIGN_DIRECTION.

## 9. Engineering deltas (summary for GPS-M2)

Schema: `User.welcomeSeenAt` (nullable ts) · checklist state (JSON col or table) · hidden Getting-Started course row (seed).
New surfaces: `/register`, `/welcome`, Hub layout + 6 card components (all states) · nav updates (public + bottom nav).
Reused: OTP flow, `syncUser` + attribution, LMS player + `LessonProgress`, analytics adapter, onboarding page (post-purchase role unchanged — **OPEN-1**).
No changes: checkout, money spine, webhook, middleware policy (Hub stays behind `/dashboard` auth).
New analytics events: `register_started`, `account_created`, `welcome_viewed`, `checklist_item_done`, `referral_link_shared`.
LAUNCH_CONFIG rows to add at build: Lesson 0 video (#10 exists) · Earn-card copy sets (#17 exists) · sample certificate image · register/welcome final copy.

## 10. Decision points — RESOLVED (founder-approved 2026-07-04)

- **OPEN-1 → RESOLVED:** Post-purchase `/onboarding` stays as-is; `/welcome` handles registration moment only.
- **OPEN-2 → RESOLVED:** Referral attribution = **first-touch, 30-day cookie**. (D-01 counsel may refine later — LAUNCH_CONFIG #1.)
- **OPEN-3 → RESOLVED:** Nudge opt-in deferred to Phase 5; no consent surface on Day 0.

## 11. DR-030 (LOCKED 2026-07-04 — recorded in Decision Register)

> **DR-030 — Free registration + Day-0 Experience.** Registration is decoupled from purchase: public `/register` (phone+OTP, optional name; no passwords ever, no forgot-password) creates a free account with auto-generated referral link; `/login` remains for returning users; checkout flow unchanged (DR-023). Post-registration one-time `/welcome` moment leads to **Lesson 0** (onboarding video as a real, skippable LMS lesson — no mandatory gates) and the **Dashboard Hub**: checklist-guided, all sections visible with truthful locked/zero/coming-soon states, webinar as opportunity (never prerequisite), universal referral link with invite-only framing pre-D-01 (link ≠ earning eligibility; no earn language until D-01 clears). Nav gains Register Free + Login (Blueprint v1.1 amendment). Fake data remains forbidden in all states (D-29 floor, DR-029).

**Changelog:**
- v1.0 (2026-07-04) — FROZEN: founder approved all three open points per recommendations; DR-030 locked.
- v0.1 (2026-07-03) — initial draft from founder + Fable design sessions.
