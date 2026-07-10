# GoSkilled — Decision Card & Dashboard Experience — Design Sprint Spec v1.0

> **Purpose.** Evolve the Phase-1 **stat cards → "Decision Cards" (Smart Action Cards)** so the dashboard feels like an original GoSkilled product, not a SaaS admin template. Founder-directed (2026-07-10; current cards rated 8.8–9/10 — clean but not memorable). Extends `Experience_System_v1.0 §10/§10.2` and Dashboard §3–§4; **does NOT reopen frozen architecture** (IA/workspaces/routes/money unchanged). This is a card-architecture + interaction + visual-identity sprint.
>
> **How to hit the bar (honest):** the memorable leap is found by **iterating on RENDERED cards** in `/design-system`, not on mockups. Build → render → visual review (founder + steward + Fable) → refine ×2–3 → lock. Timebox: this is the Phase-1 card system + Phase-2 composition; not an open-ended loop.
>
> **Locks (non-negotiable):** perf gate <2s budget-Android · **every rich effect device-tiered** (Amendments §C — glass/gradient/glow/motion degrade on low-end + `prefers-reduced-motion`) · WCAG AA (tints keep text-contrast) · **gold decorative, number charcoal** · **money static + fail-safe** (no count-up on money; `safeMoney` never ₹0) · D-29 (AI lines + viz from real data only) · Lucide icons (in stack). Design language = GoSkilled's own, synthesized from Stripe (clarity) · Arc/Raycast (polish) · Notion (calm) · Apple Wallet (depth) · Duolingo (engagement) · Linear (precision) — inspiration, never copy.

## 1. The Decision Card — anatomy
Every card answers five things in one glance: **Status · Progress · Next Best Action · AI nudge · a tiny visualization** — with breathing space between zones (cards breathe, not compress).
```
┌─────────────────────────────────────┐
│  [embedded icon]  Label      [badge] │  ← icon is part of the surface, not a floating sticker; badge = LIVE/NEW/🔥
│                                      │
│  CONTEXT is the hero (not a bare #)  │  ← "Continue Instagram Mastery · Lesson 5"  (metric cards may lead with the number)
│  72% ████████░░  or  ₹12,450         │  ← inline viz appropriate to the card
│                                      │
│  ✨ AI: Finish Lesson 3 to unlock…   │  ← in-card AI line (real trigger only, D-29)
│  ── tiny chart / ring / nodes ──     │  ← per-family visualization
│  [ Resume → ]                        │  ← explicit action CTA; whole card clickable
└─────────────────────────────────────┘
```
Rules: **context-as-hero** for action cards (Continue/Reward/Network), number-as-hero only for pure metrics; **one CTA per card**; AI line only when a real trigger exists (else omit, never fake); zones separated by generous space.

## 2. Per-family personality (NOT one template)
Each family has its own layout + signature viz + icon + action — same tokens, different soul.
| Family | Signature viz | Hero | Action | Notes |
|---|---|---|---|---|
| **Continue-Learning** | progress **ring/bar** | course + lesson + % | Resume → | the "pick up where you left off" card |
| **Wallet/Earn** | tiny **ledger area-line** | Available ₹ + Pending + **Next payout date** | View Wallet → | money **static**, charcoal, `safeMoney`; honest payout status |
| **Network** | mini **network-node** graphic | active L1 + this-month | Invite → | node viz from real counts |
| **Rewards** | **milestone track / tier badge** | "1 referral away · Silver" | Invite/Claim → | badge art per tier (Contributor→Mentor→Champion, DR-035) |
| **Streak** | **flame** (pulse/glow, device-tiered) | days + at-risk state | Learn today → | supportive framing, not loss-anxiety |
| **Progress** | **circular gauge / semicircle** | % + next milestone | View Progress → | replaces bare "72%" |
| **Analytics (wide)** | **area chart** (gradient fill + last-point highlight) | trend | Open → | lazy; ≥3-points rule |

## 3. Size & hierarchy system (bento — not all same size)
The eye must land somewhere first. Composition per workspace (Phase 2):
- **1 Hero card** (large, full-width or 2-col) — the north-star (Learn: Continue hero · Earn: Wallet/Share).
- **2 Primary** (medium) · **4 Secondary** (small) · **1 Wide** (analytics/referral/leaderboard).
- Responsive bento grid (12-col desktop → stack on mobile, hero first). Clear visual weight: Hero > Primary > Secondary > insight strips.

## 4. Real iconography (no emoji)
**Lucide** (in stack) — outline default, filled/duotone for active/emphasis; **embedded** into the card (accent-tinted rounded plate or integrated top-left), not a floating sticker. Consistent 20–24px, `currentColor`/accent. (Phosphor acceptable if a needed glyph is missing.) Remove all emoji from cards.

## 5. Premium depth recipe (paper layers — device-tiered)
Capable tier: **top accent line** (or subtle gradient border) · **very subtle radial gradient** tint (Apple-style, notice-it-not) · **soft ambient + slight colored shadow** (accent-hued, low-opacity) · **~5% top reflection/inner light**. Low tier / reduced-motion: flat tint + single soft shadow, no reflection/gradient/colored-shadow. No heavy glass on data cards; no full-card blur.

## 6. Charts & viz (beyond sparkline)
Area chart with **gradient fill + animated draw-in + last-point highlight** · donut · progress ring · semicircle gauge · milestone track · mini network-nodes · heatmap-lite (streak). Inline-SVG on critical route; Chart.js lazy for heavy. ≥3-points rule (else stat + honest line). All from real data (D-29).

## 7. Motion (subtle, device-tiered)
Card **load stagger** (fade-up 40–60ms) · **number count-up** (learning/progress/network/certs ONLY — never money) · **chart/line draw-in** · **badge pop** · **icon micro-animate on hover** · workspace-switch crossfade · number-highlight on hover. Capable tier only; low tier = instant/opacity. Everything respects `prefers-reduced-motion`. No flashy/decorative motion — each earns its place.

## 8. Background & polish
Dashboard bg: **very subtle radial gradient / faint light-spots** (single top-left light source, ES §4) — premium but unnoticed; **no heavy noise on low tier**. Hover = shadow + border-glow + gradient-shift + icon-animate + number-highlight (not just translateY), capable tier.

## 9. In-card AI + actions (GoSkilled identity)
- **AI line** per card (✨) — contextual, real trigger only: "Finish Lesson 3 today to unlock your first certificate" · "Invite 1 more friend to reach Bronze." Omit if no real trigger (never fabricate — D-29).
- **Action CTA** per card + whole-card clickable: Resume · View Wallet · Invite · Claim · View Certificate.

## 10. Sprint plan (CC)
On the parked `gps-design-system` branch (or a `gps-decision-cards` branch off it):
1. Build the **DecisionCard** base + the 7 family variants (§2) + the bento size system (§3) on Lucide + tokens, all device-tiered.
2. Add the richer viz (§6) + motion (§7) + depth recipe (§5), all behind the device-tier util.
3. Render **all families + a sample bento dashboard** in `/design-system` with real-shaped data + honest states (incl. money-fail-safe + AI-line-present/absent).
4. Green + tsc/lint/prettier; perf check on throttled profile; a11y.
5. **Render review loop:** founder + steward + Fable on the rendered page → refine ×2–3 → lock. Then this becomes the card layer for Phase 2 dashboards.

## Acceptance
Distinct per-family layouts (not one template) · real Lucide icons (zero emoji) · every card has AI line (when real) + action + tiny viz · bento hierarchy (varied sizes) · premium depth **that degrades cleanly on low tier** · perf gate held on throttled budget-Android · money static + `safeMoney` · D-29 honest · WCAG AA · reduced-motion honoured. **Founder "ye alag hai" sign-off on the rendered `/design-system`.**

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — Decision-Card sprint spec: stat→decision cards (status+progress+next-action+AI+viz), per-family personality, bento hierarchy, real icons, richer viz/motion/depth — all device-tiered/perf-gated/D-29. Extends Experience System §10; no architecture reopen. Build → render → iterate ×2–3 → lock.
