# Review Packet — Phase 5: Explore + Account (Redesign U6)

- **Branch:** `gps-explore-account` (off `main` @ `5d618c6`) · **Commit:** `7dbb542`.
- **Tier:** B (re-skin + small auth-adjacent pages; no money change). **GATE: PARKED — not merged. `main` untouched.**
- **Read:** Dashboard §5 · IA §5.4/§5.6 · Nav_Workspace v1.1 · Amendments §G (trust-triad).
- **Scope note:** **Guru + AI-insight cards are DEFERRED (DR-041) — not built.**

Re-skin in place; money math untouched; **auth logic byte-identical** (password change reuses the existing Supabase session helper — no hand-rolled auth, Golden Rule 5).

## 1. Explore / trust surfaces

- **Course Detail** (`/courses/[slug]`) — **TrustTriad AT the Buy CTA** (48-hour refund · GST-inclusive price · secure payment) per Amendments §G / DESIGN §14 (design-system marks, not stock PNGs). Verified present on a live course-detail page.
- **Checkout** (`/checkout`) — calm summary tokens + **TrustTriad at the pay decision**. `CheckoutForm` (Razorpay/OTP payment logic) **untouched**.
- **Onboarding success = activation moment** — the post-purchase `done` state now shows **"what you unlocked"** + a **48-hour-refund chip** + **ONE CTA "Start your first lesson"** → `/dashboard/learn`. The onboarding form logic (`saveOnboarding`/`skipOnboarding`) is unchanged.
- Home **"Store"** card + Learn **"Browse"** already wired → `/courses`.
- `components/marketing/trust-triad.tsx` (reusable at any Buy/Pay decision element).

## 2. Account workspace

- **Profile** — re-skinned (greeting header + calm cards); email prefs **moved to Settings** (single home).
- **Security (NEW, `/dashboard/account/security`)** — **password change, USER-PERFORMED**: `changePasswordAction` (`app/dashboard/account/actions.ts`) reuses `setPasswordForCurrentUser` + `passwordIssue` — Supabase stays the identity authority, nothing automated. Plus **active sessions** (this device + **"Sign out of all devices"**, global scope).
- **Settings (NEW, `/dashboard/account/settings`)** — notification prefs (existing `EmailPrefToggle`) + **Language** (Hinglish, default) + **Theme** (Light; dark coming). Honest — no fake toggles (D-29).
- **Nav** — Account = **Profile · KYC · Security · Settings · Support · ←Home**; `activeWorkspaceKey` maps `/dashboard/account/*` → Account.

## 3. Personalization

- `lib/greeting.ts` (dynamic greeting from real name + IST time-of-day, D-29). Extended to the **Earn** header (Home/Learn/Profile already personalized). **No AI-insight cards** (deferred with Guru).

## Verification

```
tsc --noEmit → 0 · prettier → clean · eslint (changed) → 0/0
vitest --exclude integration → 373 passed
auth non-regression → 22 passed  (login-actions · register-actions · password-policy · post-auth-redirect)
```

**Browser (next-dev, authenticated):** no console errors.

- **Account nav** = Profile · KYC · **Security · Settings** · Support · ←Home.
- **Security** — Change-password form + Active-sessions ("This device") + "Sign out of all devices".
- **Settings** — Notifications + **Hinglish** (Default) + **Light** (dark coming).
- **Course Detail** — the trust-triad (all three marks) renders on a live course page; **Checkout** trust-triad renders.

> **Screenshots note (honest):** the preview renderer got stuck after HMR churn (same as Phases 3–4) — I verified via authoritative server-fetch + live-DOM inspection instead (assertions above). The **onboarding activation moment** is in the post-save `done` state (needs a real purchase to reach live) — implemented + typechecked.

## Locks held

Re-skin in place (no route/business-logic edits; CheckoutForm + onboarding-save logic untouched) · money math untouched · **auth byte-identical** (password change = existing helper, user-performed, no auto) · D-29 honest states (no fake language/theme toggles; honest "coming" copy) · device-tiered · WCAG (labels, focus rings, ≥44px).

## Notes / decisions (flagged)

- **Guru + AI-insights DEFERRED (DR-041)** — not built anywhere this phase.
- **Courses / Packages** retain their existing DESIGN_DIRECTION marketing polish (already on the design system); the Explore re-skin concentrated on the **decision/trust surfaces** (Course Detail Buy, Checkout, activation moment) which carry the value.
- **Active sessions** shows the current device + a global sign-out (Supabase doesn't expose a per-session list to the user client without the admin API); a full session list is a future item.
- **Language / Theme** are honest read-only states today (Hinglish default; Light, dark dormant) — real switches land when i18n / dark-mode ship.
- **Security/Settings routes** are genuinely new pages under `/dashboard/account/*` (the shell wraps them; no existing page changed).

## Self-assessment

1. Trust-triad placed at every Buy/Pay decision (§G); checkout + onboarding activation moment done without touching payment/onboarding logic.
2. Security/Settings built lean + honest; password change is user-performed via the existing helper (auth untouched; 22 auth tests green).
3. Guru/AI-insights correctly deferred (DR-041) — nothing built.
4. Greeting personalization extended to the Earn header; green suite; no console errors.
5. Parked for review — no merge; honest about the screenshot gap + the Courses/Packages scope call.
