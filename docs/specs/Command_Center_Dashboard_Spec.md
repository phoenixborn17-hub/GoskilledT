# GoSkilled — Hybrid Command-Center Dashboard Spec v1.0

> **Status: DRAFT — awaiting founder approval. No code changes with this document.**
> **Basis:** founder decision (LOCKED, 2026-07-12): dashboard = **HYBRID** — Home is a unified
> cross-domain command center; Learn/Earn stay focused-depth workspaces; ONE vocabulary + one
> consistent shell; the journey break gets fixed. Built directly on
> `docs/audit/PREMIUM_ELEVATION_PLAN.md` (Phase-1 read of `main@696d493`).
> **Governing specs (all remain binding, none reopened):** `GoSkilled_Experience_System_v1.0`
> (tokens · type · motion · charts · states) · `DecisionCard_System_v1.0` + `DecisionCard_Pass2`
> (card anatomy · depth recipe · Spark) · `Nav_Workspace_Architecture_v1.1` (**LOCKED** — this spec
> changes zero nav structure) · `ThreeState_RichHonestZero_Principle` (binding design law) ·
> `FeatureVisibility_System_v1.0` (DR-040) · `docs/DESIGN_DIRECTION.md` v1.0 (constitution).
>
> **Hard locks honored throughout:** green `#137E49` / gold **decorative-only** / charcoal · Sora +
> Inter · money static + `safeMoney` + PAISE · **income/earn content ONLY for eligible users** ·
> recorded-not-payable framing (DR-043) · no income promise (D-29) · payouts OFF (D-01) ·
> rich-honest-zero (ThreeState) · perf gate <2s budget-Android · device-tiered motion + static
> fallback · `prefers-reduced-motion` · WCAG AA · **learning-first positioning** (vibrant and
> rewarding for everyone; never income-forward by default).

---

## §0. The one-sentence design thesis

**Home answers "how is my whole GoSkilled life going, and what should I do next?" across both
domains; Learn and Earn answer it deeply for one domain each — and every screen speaks the same
visual language so the product reads as one app, not two.**

The elevation plan found the product is "two GoSkilleds": a premium hub layer and a legacy interior
layer. This spec is the blueprint for closing that gap in five bounded, one-builder slices:
**Home Command Center → vocabulary sweep → course player → wallet/money-trust → journey-break.**

---

## §1. THE HYBRID SHELL — one product, two depths

### 1.1 What stays exactly as-is (Nav v1.1 LOCKED)

- Thin persistent switcher **Home · Learn · Earn · Account** (72px desktop rail == mobile bottom
  bar), contextual sidebar per workspace, `[data-theme]` re-theming (neutral / learn-green /
  earn-gold), DR-040 recomposition, persistent Share. **No nav items move. No routes are renamed.**
- The switcher IS the hybrid's spine: Home = the cross-domain center; entering Learn/Earn = focused
  depth. The model already exists — this spec finishes the *feel*.

### 1.2 The three chrome rules that kill the "two apps" feeling

The seam users feel is not navigation — it is that surfaces on either side of a click are drawn in
different vocabularies. Three shell-level rules make it ONE product:

**R1 · One canvas.** Every `/dashboard/*` surface (including the player and every Earn interior)
renders on the same page background (the subtle single-light-source radial from DecisionCard §8),
same content max-width, same `p-4/p-6` content padding, same `space-y-8` section rhythm as the Home
hub. A user crossing Home → Wallet → Player never sees the canvas change under them — only the
workspace theme tint.

**R2 · One header grammar.** Every workspace page opens with the same header block:
`font-heading text-h1 font-extrabold text-ink` title · one `text-body text-ink-muted` context line ·
optional right-aligned Badge. The sidebar header stops repeating the workspace label (the plan's
triple-label fix): it instead carries a **workspace snapshot** — Learn: "3 courses · 41%" · Earn:
"₹X recorded" (eligible only, `safeMoney`) · Account: the user's name. One `SidebarSnapshot`
component, data from the same composed summaries the pages already load. Honest zeros welcome.

**R3 · One connective mark — the Spark.** The Spark (accent dot + breathing halo, today locked
inside DecisionCards) becomes the product's recurring signature, honest-trigger only:
- **Greeting bullet** on the Home command header (always — it marks "your live status line").
- **Switcher pip**: a Spark dot on a workspace icon when real attention is owed (Learn: streak at
  risk today · Earn: a commission moved HELD→AVAILABLE). Never for marketing nudges.
- **Progress-ring endpoint** in the player header (§4.1).
- **Metric-card live-edge** (§2.4).
Implementation: one shared `<Spark />` element + `.gs-spark` class (dot `6px` currentColor, halo =
`@keyframes` scale/opacity breath ~2.4s, capable tier only; reduced/low tier = static dot). Zero new
colors — it inherits the workspace accent.

### 1.3 Where each content type lives (the hybrid contract)

| Content | Home (command center) | Learn / Earn (focused workspace) |
|---|---|---|
| Metrics | **Cross-domain key-metric row** — one card per domain, glanceable | Full per-domain stat rows + analytics tabs |
| Analytics | One compact momentum band (≤2 charts) | Deep charts, filters, history tables |
| Actions | Next-best-action feed (≤4, rules-driven) | Domain workflows (resume, withdraw, invite) |
| Zero states | Motivating unlock micro-lines (ThreeState) | Full rich-honest-zero shells |
| Depth | Never — every Home card links into a workspace | Always — this is where work happens |

Home never duplicates a workspace's full UI; it shows the **headline + trend + one action** and
links in. That is the anti-"two dashboards" rule: one number lives in exactly one deep place, and
Home only *glances* at it.

---

## §2. HOME COMMAND CENTER — exact layout

Rebuild of `app/dashboard/home/page.tsx` (composition only — `lib/home/summary.ts` grows fields; no
new money/business logic; all reads from existing sources).

### 2.1 Page composition (top → bottom, mobile-first single column; desktop 12-col bento)

```
① COMMAND HEADER   greeting (time-aware) + Spark live-stake line + Founding-Batch badge
② KEY-METRIC ROW   4 MetricCards — cross-domain, role/eligibility-aware        [first viewport]
③ CONTINUE HERO    Continue-Learning DecisionCard (bento hero)                 [first viewport ≥768px]
④ MOMENTUM BAND    learning activity chart · (eligible only) earn trend
⑤ FOR-YOU FEED     next-best-action + recent activity (merged, rules-driven)
⑥ WORKSPACE STRIP  Enter-Learning / Enter-Earn snapshots (existing, streamed)
⑦ STORE STRIP      demoted below the fold (was #1 — the plan's QW-1 reorder)
⑧ SHARE + ANNOUNCEMENTS (existing; Share eligible-only; Announcements dismissible-and-stays)
```

Order rationale: the 90% case is a returning learner — momentum before merchandising. The Store
strip moves from position 1 to ⑦ (still first-class per Nav v1.1, no longer the first thing the
eye lands on). ① + ② + (desktop) ③ are the server-composed first viewport (`getHomeSummary`,
zero-CLS skeletons); ④–⑧ stream via Suspense as today.

### 2.2 ① Command header — the greeting owns a live stake

- **Line 1 (H1, Sora extrabold, ink):** time-aware — "Namaste, {firstName}" with daypart flavor
  (Subah/morning · Dopahar/afternoon · Shaam/evening) from `lib/home/summary.ts` greeting
  composition (extend the existing `greetingTitle`).
- **Line 2 — the "today's spark" line:** `<Spark/>` bullet + ONE honest lifecycle sentence, picked
  by priority rules over real state (first match wins):
  1. streak at risk → "A 2-minute lesson today keeps your {n}-day streak."
  2. near certificate → "{k} lessons to your {course} certificate."
  3. (eligible) commission cleared → "₹{x} moved to Available." (`safeMoney`)
  4. webinar today → "Live webinar at {time} — seat's saved."
  5. active default → "Day {n} — pick up {course} where you left off."
  6. new-user default → "Your first lesson is 2 minutes away."
  Never fabricated, never income-forward for non-eligible users, omitted states omit (D-29).
- Right: `Badge variant="gold"` Founding Batch (unchanged).

### 2.3 ② Key-metric row — the cross-domain unification (the heart of the hybrid)

Four **MetricCards** (§5.2) in a `grid-cols-2 md:grid-cols-4` row. Composition is
**role/eligibility-aware** — three tiers, resolved server-side with the predicates that already
exist (`isFeatureVisible("earn")` for DR-040; the DR-038 eligibility fork already built for the
Earn hub §D):

| Slot | Everyone (earn hidden — DR-040) | Earn visible, NOT eligible (DR-038) | Eligible affiliate |
|---|---|---|---|
| 1 | Learning progress (ring) | Learning progress (ring) | Learning progress (ring) |
| 2 | Streak (flame + 7-day heat) | Streak | Streak |
| 3 | Certificates (count + seal) | Certificates | Certificates |
| 4 | Next webinar / next milestone | **Network** (invites, honest zero — no ₹) | **Recorded earnings** (gold accent, DR-043) |

Honesty rules for slot 4:
- Earn hidden → zero earn trace anywhere on Home (DR-040 recomposition — already the law).
- Visible-not-eligible → the card is about **people, not money** ("2 friends joined"), CTA "See how
  earning works" → Earn hub's eligibility fork. No rupee figure, no income copy (learning-first).
- Eligible → label **"Recorded earnings"**, `.dc-number` + `safeMoney`, status badge shows the
  honest lifecycle (`Held` amber / `Available` green), subline states the DR-043 truth plainly:
  "Recorded to your wallet — payouts open at launch" while D-01 is closed. NEVER "ready to
  withdraw", never a projection, no count-up (money is static).

### 2.4 MetricCard anatomy (rich info-component, not a number-in-a-box)

A new `size="metric"` variant of the existing `DecisionCard` shell (same file family,
`components/cards/decision/`), so depth/hover/tiering/a11y are inherited, not re-invented:

```
┌──────────────────────────────────┐
│ ▔▔▔▔▔▔▔▔●▔▔▔▔▔▔  ← accent top line; ● = Spark LIVE-EDGE (honest trigger only)
│ [icon-plate]  LABEL     [badge]  │  icon: dc-icon-plate 40px, Lucide 20px, accent-tinted
│                                  │  label: Inter text-small font-semibold text-ink
│  41%   ◔        or   ₹4,250     │  value: .dc-number Sora text-h1 tabular; unit de-emphasized
│  ▁▂▄▆▅▇  mini-viz (32–40px)     │  per-slot viz: ring / heat-strip / seal-count / area-line
│  ↑ 2 lessons this week           │  delta line: text-caption ink-muted; semantic icon+label
│  (zero: unlock micro-line)       │  ThreeState: New shows motivation, not blankness
└──────────────────────────────────┘
```

- **Typography:** value always `.dc-number` (Sora, `tabular-nums`); money additionally `safeMoney`
  and never animated. Label/ delta in Inter. No raw `text-2xl` anywhere.
- **Mini-viz per slot (components already owned — CC-3):** progress → `ProgressRing`; streak →
  heatmap-lite 7-day strip (new tiny SVG, §5.2) with `Flame`; certificates → seal glyph + count;
  earnings → 14-day `Sparkline`/`AreaChart` mini (≥3-points rule, else stat + honest line);
  network → `NetworkNodes` mini.
- **Status badge:** existing `CardBadge` tones (live/new/hot) + a `held` amber tone for money.
- **Spark live-edge:** the Spark dot sits ON the card's accent top line only when the card carries
  a live, honest state (streak alive today · lesson in progress · commission recently moved).
  Absent otherwise — its absence is information too.
- **Tap target:** whole card links to its deep surface (≥44px, focus ring per DecisionCard).

### 2.5 ④ Momentum band — visual analytics, eligibility-forked

Two `ChartPanel`s (§5.3) side-by-side on desktop, stacked mobile:
- **Learning momentum (everyone):** 14-day activity area chart (`AreaChart`, green ramp, gradient
  fill, last-point highlight, draw-in on first paint only). Zero state: full-size panel, honest
  axis, "Your momentum graph starts with your first lesson" + CTA. New→Active→Power: New = unlock
  shell · Active = 14-day area · Power = adds best-week annotation + streak overlay.
- **Earn trend (ELIGIBLE ONLY):** referrals + recorded-commission trend (the Phase-B graph data,
  compact). Gold accent decorative, figures charcoal tabular. Non-eligible users get NO second
  chart — the learning chart takes the full width (recomposition, not a locked teaser; keeps Home
  learning-first).

### 2.6 ⑤ For-you feed — next-best-action + activity, one stream

Merge today's `Priorities` ("For you today") and recent activity into one `WidgetContainer` feed:
rules-driven action items first (webinar today · streak-at-risk · resume · (eligible) KYC-pending ·
cleared-commission), then 2–3 real recent-activity rows (lesson completed, certificate issued,
(eligible) referral joined). Every row = existing `NotificationCard` grammar (icon · title ·
one-liner · time · tone · href). Cap 5 rows; "all caught up" celebratory empty (§12 state library).
Real events only — no synthetic activity ever (D-29).

### 2.7 ThreeState table (Home CC — every element defines all three)

| Element | NEW user | ACTIVE user | POWER user |
|---|---|---|---|
| Command header | "Your first lesson is 2 min away" spark line | live stake line (streak/cert) | live stake + cleared-money line (eligible) |
| Metric: progress | ring at honest 0% + "Lesson 1 unlocks your analytics" | real % + delta | % + per-course drill hint |
| Metric: streak | 0 + "Start today" | days + 7-day heat | days + best-streak annotation |
| Metric: certificates | 0 + "Your first seal awaits" | count + latest name | count + trophy-shelf link |
| Metric: earnings (eligible) | ₹0 honest + "Wallet ready to receive" | recorded ₹ + Held/Available badge | ₹ + trend mini-chart |
| Continue hero | "Pick your first course" DecisionCard | Resume card + ring | Resume + next-milestone track |
| Momentum band | unlock shells (full-size, honest) | real charts | annotated charts |
| For-you feed | getting-started steps as feed rows | rules-driven nudges + activity | denser activity, insights |
| Getting-started strip | present (one strip, not the page) | absent | absent |

Nothing is suppressed at zero; nothing is fabricated at any state. The dashboard guides.

---

## §3. UNIFIED VOCABULARY — the single token/class system + migration checklist

### 3.1 The canonical vocabulary (already exists — this section makes it law)

One system for every `/dashboard/*` surface and the player. **The mapping (legacy → canonical):**

| Legacy (retire) | Canonical (only allowed form) |
|---|---|
| `text-charcoal` | `text-ink` |
| `text-muted` | `text-ink-muted` |
| `text-brand` / `text-brand-*` | `text-theme` (decorative) / `text-theme-strong` (text) |
| `bg-offwhite` | `bg-surface` (page) / `bg-surface-raised` (card) |
| ad-hoc `bg-white border rounded-2xl shadow` cards | `DecisionCard` family, or `bg-surface-raised border-line rounded-gs-lg` for plain panels |
| `rounded-2xl` / `rounded-xl` (surfaces) | `rounded-gs` / `rounded-gs-lg` |
| raw `text-2xl/3xl font-bold` headings | type-scale tokens `text-h1..h4` + `font-heading` (Sora) |
| raw numbers for stats/money | `.dc-number` (+ `safeMoney` for money, PAISE→₹ display only) |
| flat `EmptyState` on dashboard surfaces | rich-honest-zero pattern (§5.5) |
| bespoke trust rows | `TrustTriad` slots (§5.6) |
| per-file spinner/blank loading | branded `Skeleton` shimmer |

**Enforcement:** after each surface migrates, add that path to a grep-based lint guard
(`scripts/` check or ESLint `no-restricted-syntax` on the legacy class names, scoped per migrated
directory) so the debt cannot regrow silently. Marketing/public surfaces are OUT of scope here
(they migrate on their own polish track); `components/ui` primitives migrate once, first.

### 3.2 Per-surface migration checklist (real files, from the live census — 522 legacy hits)

Work per-surface as each slice touches it (never big-bang). Order = shared-first, then anchors,
then interiors. Each row is checkbox-complete only when: zero legacy classes in the file ·
type-scale + `.dc-number` applied · states (loading/empty/error) on canonical patterns · mobile
320px verified · reduced-motion verified.

**Wave V0 — shared primitives (unblocks everything):**
- [ ] `components/ui/{empty-state,error-state,success-state,card,button,badge,alert,input,label,form-field,otp-input}.tsx` — token-swap only, zero API change
- [ ] `components/nav/app-shell.tsx` (1 hit) + `SidebarSnapshot` (§1.2 R2)

**Wave V1 — player cluster (consumed by Slice 3):**
- [ ] `app/dashboard/learn/[courseSlug]/page.tsx` (9)
- [ ] `components/dashboard/lesson-player.tsx` (7)
- [ ] `components/dashboard/quiz/quiz-checkpoint.tsx` (17)
- [ ] `components/dashboard/certificate-moment.tsx` (6) · `certificate-card.tsx` (5) · `share-cert-button.tsx` (2)

**Wave V2 — earn interiors (consumed by Slice 4):**
- [ ] `components/affiliate/wallet-summary.tsx` (6) · `held-credit-row.tsx` (2) · `withdraw-form.tsx` (2)
- [ ] `components/affiliate/kyc-form.tsx` (7)
- [ ] `components/affiliate/referral-tree.tsx` (6) · `mini-chart.tsx` (2) · `share-block.tsx` (2) · `add-lead-form.tsx` (1)
- [ ] `app/dashboard/earn/*` page shells (commissions · network · leaderboard · rewards · referrals · my-leads)

**Wave V3 — remaining dashboard components:**
- [ ] `components/dashboard/{profile-form,email-pref-toggle,logout-button,referral-milestone}.tsx`
- [ ] `components/dashboard/gamification/{streak-chip,milestones}.tsx`
- [ ] `components/dashboard/hub/checklist-card.tsx`
- [ ] `components/dashboard/guru/guru-panel.tsx` (dormant behind DR-041 flag — migrate last, lowest priority)
- [ ] `app/welcome/page.tsx` (3) — celebration surface, keep visuals identical, tokens only

**Explicitly out of scope:** `components/marketing/*`, `app/{courses,packages,about,webinar,…}` public
pages, `components/admin/*` (admin has its own AO-track in the elevation plan). Log skipped
surfaces as `PRODUCT_DEBT.md` rows per DR-031.

---

## §4. THE THREE ANCHORS — design direction

### 4.1 Anchor A — Course player: focus + momentum (elevation plan HS-1)

The highest-value surface becomes the best one. **Absolute guardrails: server-gated playback,
signed-URL flow, data-saver, resume position, quiz checkpoint logic, entitlement checks — byte-level
untouched. This is presentation + interaction only.**

- **Focus mode.** While a lesson route is active: the contextual sidebar collapses to a slim
  icon rail (lesson list becomes an overlay/drawer on demand); the switcher stays (1-tap escape —
  Nav v1.1 intact); the topbar slims to course title + the progress ring. The learning canvas gets
  the screen. Exiting the player restores full chrome. Reduced-tier: collapse is instant, no width
  animation.
- **The signature: the ring that fills as you watch.** Header `ProgressRing` (already owned) with a
  Spark on its endpoint, bound to course completion; on lesson-complete it ticks forward with the
  spec's 300ms fill + subtle pulse. (Optional capable-tier micro: within-lesson watch progress as a
  faint secondary arc from `video.currentTime` — no persistence changes, display only.) Replaces
  the "3 / 12 lessons" text; the count stays as the ring's aria-label + tooltip.
- **Momentum at completion.** "Next lesson" = primary button with the up-next title previewed
  ("Next: Lighting basics · 4 min"); "Mark complete" secondary. Completion = check-draw 300ms →
  ring tick → focus moves to Next. Course-complete keeps the existing confetti/certificate moment.
- **Lesson list hierarchy.** Module headers get real hierarchy (Sora `text-h4` + per-module
  progress "3/5") replacing `text-xs uppercase muted`; active lesson row in the `dc-accent`
  language (accent bar + tinted plate); completed = check; locked = lock + honest label.
- **Defect fix riding along:** locked-lesson CTA links the course's ACTUAL package, not hardcoded
  `career-booster` (coordinate with W2 if already fixed there).
- Vocabulary: Wave V1 files (§3.2). Quiz checkpoint and certificate moment re-skinned in the same
  pass so the full lesson loop is one language.

### 4.2 Anchor B — Wallet + money-trust interior (elevation plan HS-2/HS-3)

The most trust-critical screen in a scam-wary market. **Guardrails: ledger-derived balances, DR-025
lifecycle, DR-038 gate, withdraw eligibility logic untouched — display layer only. Money =
`.dc-number`, `safeMoney`, static, charcoal; gold is frame, never figure.**

- **Layout (calm authority, Register-2):** header per R2 grammar → hero `WalletCard` as a gold-accent
  DecisionCard: **Available** (the one big number) · Held · Lifetime recorded, each `.dc-number`
  tabular, each with a plain-language one-liner. DR-043/D-01 framing is structural, not a
  footnote: a persistent, calm status line — "Earnings are recorded to your wallet now; payouts
  open at launch." (copy = LAUNCH_CONFIG slot; never a countdown, never a promise).
- **The signature: the "clearing" stack.** Held commissions render as soft stacked layers (one per
  held credit, from `held-credit-row` data) each showing its honest 48-h window ("clears
  {date·time}"); when a credit clears it settles into Available (200ms slide + tint shift, capable
  tier; instant otherwise). D-01's constraint becomes a visible, confidence-building mechanic —
  the product *showing* the safety rule instead of apologizing for it.
- **History:** transaction rows on the canonical money-row treatment (§5.4): right-aligned tabular
  ₹, signed color + icon + label (never color-only), status chips (Held amber / Available green /
  Cancelled neutral — CLAWBACK shown honestly as "reversed — order refunded").
- **Trust furniture:** one `TrustTriad` (§5.6) at the withdraw decision point (razorpay-verified ·
  ledger-backed · 48h refund honesty). Withdraw remains gated exactly as built (KYC inline gate,
  D-01 flag); the gate state renders as a rich honest card, not a disabled button alone.
- **Rich zero (ThreeState):** new affiliate sees the FULL wallet — ₹0 honest, clearing-stack empty
  shell ("Your first commission will appear here and clear in 48h"), history unlock line. Never a
  shrunken page.
- **KYC form (4b, same language):** security-forward header at the point of input ("encrypted
  AES-256 · seen only by our payout team"), stepper, styled file-drop replacing raw inputs, calm
  review-status states. Zod/encryption/server logic untouched.

### 4.3 Anchor C — In-app browse + detail: the journey-break fix (elevation plan HS-4/§6.1)

Authenticated users never land on marketing chrome again.

- **New routes (inside the shell, Learn theme):**
  - `/dashboard/learn/browse` — in-app catalog index: course grid (existing catalog data +
    `CourseCard` grammar), owned-vs-unowned obvious at a glance (owned = seal/“Enrolled” + Resume;
    unowned = price + detail link), plus a **Packages section** (Skill Builder vs Career Booster
    comparison, honest labeling per DR-021) so `/packages` CTAs have an in-app home.
  - `/dashboard/learn/browse/[slug]` — in-app course detail: reuses the public detail's building
    blocks (curriculum timeline, free-preview locks, certificate preview, TrustTriad at CTA) inside
    the app frame. CTA → checkout with a return-into-app `next`.
  - Static segment `browse` takes precedence over `[courseSlug]` (Next.js routing); add a
    reserved-slug guard in the admin catalog editor so no course can be slugged `browse`.
- **Re-point the eight confirmed crossings** (from the plan's verified table):

| Surface | Today | Becomes |
|---|---|---|
| Learn sidebar "Browse" (`lib/nav/workspaces.ts:72`) | `/courses` | `/dashboard/learn/browse` |
| Home Store strip (`home/page.tsx`) | `/courses` | `/dashboard/learn/browse` |
| My Courses "discover more" (`dashboard/courses/page.tsx`) | `/packages` | `/dashboard/learn/browse#packages` |
| Progress upsell (`dashboard/progress/page.tsx`) | `/packages` | `/dashboard/learn/browse#packages` |
| Earn get-package (`dashboard/earn/page.tsx`) | `/packages` | `/dashboard/learn/browse#packages` |
| Player locked lesson | `/checkout?package=career-booster` | checkout w/ correct package + in-app return |
| Home/Learn "Join webinar" | `/webinar` | `/dashboard/learn/webinars` (thin in-app wrapper reusing the existing webinar components inside the shell; sidebar "Webinars" re-points too) |
| Account "Support" (`lib/nav/workspaces.ts:110`) | `/contact` | **stays public — accepted seam** (low-frequency, exit-tolerant); logged as a PRODUCT_DEBT row for a future in-app support page |

- Public `/courses`, `/packages`, `/webinar` remain untouched for logged-out acquisition. Checkout
  stays its own focused money surface (per plan §6.1; the HS-5 checkout elevation is NOT in this
  spec's slices) but is entered from in-app and returns in-app (`?next=` respected — pairs with the
  QW-4 query-string fix).
- `activeWorkspaceKey` already maps `/dashboard/learn/*` → Learn; no nav-model change (LOCKED).

---

## §5. PREMIUM CARD SYSTEM — reusable patterns (GoSkilled's own language)

Learned-from (Stripe clarity · Apple Wallet depth · Duolingo motivation · Linear precision), never
copied: everything below is composed from OUR tokens, the DecisionCard depth recipe, and the Spark.
All patterns: device-tiered, reduced-motion-gated, WCAG AA, whole-card ≥44px targets, honest states
built in.

**5.1 `DecisionCard` (exists — the root).** Unchanged contract: icon-plate · label · badge ·
hero/viz zone · AI line (real trigger only) · one CTA · loading/error baked in. Every new pattern
is a variant or composition of this shell — never a parallel card system (that is how the two-app
feeling started).

**5.2 `MetricCard` (new `size="metric"` variant).** §2.4 anatomy. Props: `label · icon · accent ·
value` (node — ring/₹/count) `· viz` (mini slot) `· delta` (icon+label, semantic) `· live`
(Spark edge, honest trigger) `· zeroLine` (ThreeState unlock copy) `· href`. Ships with the tiny
**heat-strip** SVG (7 cells, green ramp, `aria-label` fallback) as the one new viz primitive.

**5.3 `ChartPanel`.** Header (title + optional range control) · chart slot (`AreaChart`/`Sparkline`
/Chart.js-lazy) · honest empty shell (full-size, unlock line + CTA — never a shrunken box) ·
skeleton · data-table a11y fallback. ≥3-points rule enforced at the component (fewer → stat +
honest line, chart suppressed).

**5.4 Money-row / money-column treatment (CF-2).** One utility applied everywhere ₹ renders in a
list or table: `.dc-number` + `tabular-nums` + right-aligned column · sign via icon+label+color ·
status chip tones (held-amber / available-green / cancelled-neutral / failed-red) · `safeMoney`
always. Consumers: wallet history, commissions table, admin money tables (AO-track).

**5.5 Rich-honest-zero pattern (CF-4).** Retires flat `EmptyState` on dashboard surfaces: the FULL
component shell renders (DecisionCard depth), value at honest zero, one motivating unlock line, one
CTA. The rule is structural: **a zero state is the same component at zero, never a different,
smaller component.**

**5.6 `TrustTriad` (CF-1).** One component, three slots (icon + 3-word claim each), per-context
content presets (checkout · wallet/withdraw · course-detail CTA). Only verifiable claims (D-29).
Replaces the ≥4 bespoke trust treatments as surfaces get touched.

**5.7 `Spark` mark (CF-3).** §1.2 R3. One element, four sanctioned placements (greeting bullet ·
switcher pip · ring endpoint · metric live-edge) + the certificate-seal accent when the trophy-shelf
lands. Honest triggers only — a Spark that lies kills the mark.

**Motion budget (all patterns):** load stagger 40–60ms fade-up · ring/bar fill 300ms · chart draw-in
first-paint-only · badge pop · NO count-up on money ever · capable tier only; low tier/reduced =
opacity/instant. Perf: no new fonts, no new libs, inline-SVG on critical routes, Chart.js stays
lazy behind tabs.

---

## §6. PHASE-2 SLICES — one reviewable unit each, one builder each

Order is the founder-locked sequence. Every slice: built after W1/W2 merge · branch from up-to-date
`main` · parked with a Review Packet · **GATE: no self-merge, ANY tier** · §19 review ritual verdict
("meets Design Direction v1.0" or PRODUCT_DEBT rows). All slices are presentation/composition —
any slice that finds itself needing to touch money/auth/webhook LOGIC stops and escalates to
Tier A + founder.

### SLICE 1 — HOME COMMAND CENTER (+ the foundations it consumes)
**Scope:** `Spark` mark + `MetricCard` + `ChartPanel` + heat-strip + rich-zero pattern +
`SidebarSnapshot` (built first, rendered in `/design-system` with all ThreeStates incl.
money-fail-safe) → then the Home rebuild per §2 (① – ⑧, reorder included) → shell rules R1/R2
applied to Home. Extend `lib/home/summary.ts` (greeting stake rules · metric fields · momentum
series — reads over existing sources only).
**Files:** `app/dashboard/home/page.tsx` · `lib/home/summary.ts` · `components/cards/decision/*`
(new variants) · `components/data/*` (heat-strip) · `components/nav/` (snapshot, pip hooks) ·
`app/design-system/*`.
**Out:** Learn/Earn workspace pages, player, wallet, any route change.
**Acceptance:** eligibility tiers render correctly (hidden / visible-not-eligible / eligible — no ₹
leak to non-eligible) · ThreeState table §2.7 fully demonstrated · first-viewport zero-CLS ·
320px · reduced-motion · AA · typecheck + tests green. **Tier B** (escalate if summary reads touch
anything new on the money path).

### SLICE 2 — VOCABULARY SWEEP, Wave V0 (+V3 opportunistic)
**Scope:** §3.2 Wave V0 shared primitives + the grep lint-guard + Wave V3 low-risk components.
Pure token migration — zero behavior, zero API change, screenshots before/after per surface.
**Out:** V1 player files (Slice 3 owns), V2 earn files (Slice 4 owns).
**Acceptance:** zero legacy classes in migrated paths (guard proves it) · visual parity or better ·
tests green. **Tier B.** *(Waves V1/V2 ride inside Slices 3/4 so each anchor lands as one coherent
unit — the checklist is the contract for whoever builds.)*

### SLICE 3 — COURSE PLAYER (focus + momentum + Wave V1)
**Scope:** §4.1 complete — sliced internally a) token re-skin + header ring, b) focus-mode chrome,
c) completion-momentum + ring animation + lesson-list hierarchy. Locked-CTA package fix.
**Files:** `app/dashboard/learn/[courseSlug]/page.tsx` · `components/dashboard/lesson-player.tsx` ·
quiz/certificate cluster · shell (focus collapse).
**Guardrail:** playback gating / signed URLs / progress persistence byte-identical — diff must show
presentation only. **Acceptance:** ring binds to real progress · Next-primary flow · module
hierarchy · 320px + data-saver path intact · reduced-motion · AA. **Tier B, escalates to Tier A if
any entitlement/URL code moves.**

### SLICE 4 — WALLET + MONEY-TRUST (+ KYC 4b + Wave V2)
**Scope:** §4.2 — wallet interior on DecisionCard language · clearing stack · money-row treatment ·
TrustTriad at withdraw · rich zero · DR-043/D-01 framing (copy via LAUNCH_CONFIG row) · then 4b KYC
form dress. Commissions/network/leaderboard/rewards pages get Wave V2 token migration + money-row
adoption (full redesign of those interiors stays on the CS-track backlog).
**Guardrail:** balances remain ledger-derived reads; withdraw/KYC server logic untouched; Held
never withdrawable; no payable framing while D-01 closed.
**Acceptance:** money never ₹0-on-fail (`safeMoney`) · Held/Available visually distinct + honest ·
clearing stack states (0/1/n credits) · AA on gold surfaces (charcoal text) · money tests green
untouched. **Tier A review** (money-adjacent display + PII-adjacent KYC — mandatory Fable pass).

### SLICE 5 — JOURNEY-BREAK FIX (in-app browse + detail + re-point)
**Scope:** §4.3 — sliced internally a) `/dashboard/learn/browse` index (+ packages section),
b) `/dashboard/learn/browse/[slug]` detail, c) re-point the 8 crossings + webinar wrapper +
checkout in-app return + reserved-slug guard.
**Guardrail:** public routes untouched; checkout flow logic untouched (entry/return links only);
Nav v1.1 structure unchanged (labels/hrefs re-point per table only).
**Acceptance:** an authenticated user can browse → inspect → enter checkout → return without ever
seeing marketing chrome or a Login button · owned-vs-unowned obvious · deep-links open correct
sidebar/theme · `?next=` round-trip verified. **Tier B, escalate to Tier A for the checkout-return
touch.**

**Dependencies:** 1 → (2 ∥ 3) → 4 → 5 is safest; 2 can run parallel to 3 since file sets are
disjoint by design. Anything discovered out-of-scope mid-slice → `PRODUCT_DEBT.md` row, keep
moving (DR-031).

---

## §7. Open items for the founder (none block Slice 1)

1. **Wallet framing copy** (§4.2) — exact DR-043/D-01 sentence → LAUNCH_CONFIG row (slot shipped
   with honest placeholder marked for pre-launch finalization).
2. **Support seam** (§4.3 table) — accept `/contact` staying public for V1 (recommended), or ask
   for an in-app support page as a future slice.
3. **Webinar wrapper** (§4.3) — confirm the thin in-app `/dashboard/learn/webinars` wrapper is
   wanted in Slice 5c (recommended; it is the last frequent crossing).

## Change log
- v1.0 — 2026-07-12 (Claude Code) — Hybrid Command-Center blueprint per locked founder decision:
  hybrid shell rules (R1–R3, Nav v1.1 untouched) · Home Command Center exact layout + MetricCard
  anatomy + eligibility tiers + ThreeState table · unified-vocabulary law + per-file migration
  checklist (522-hit census) · three anchors (player focus/momentum · wallet clearing-stack ·
  in-app browse/detail) · premium card system (7 patterns) · five bounded Phase-2 slices with
  guardrails, acceptance, and review tiers. Spec only — no code changed.
