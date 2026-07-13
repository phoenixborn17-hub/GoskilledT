# GoSkilled — Vibrant Card System · Amendment v1.0

> **Status: founder-approved rollout** (v5 preview locked 2026-07-12; this amendment promotes it
> from the `/design-system/vibrant` direction study into the REAL design system). **Amends**
> `GoSkilled_Experience_System_v1.0` §2 (accents) / §10.2 (card families) and
> `DecisionCard_System_v1.0` §5 (depth) — it does not replace them: the dc-recipe remains valid;
> the vibrant recipe is the richer sibling surfaces adopt as the rollout proceeds (Slice A = Home;
> Slices B/C = Learn, Earn/wallet). Mirrored per DR-027.

## §1. The six-accent map (meaningful, never rainbow)

| Family | Accent | `--vh` core | Text on light tints | Use |
|---|---|---|---|---|
| Learning | emerald | `#137E49` | ink / `#0C5A34` | progress, courses, activity |
| Earn | champagne gold | `#B8860B→#E6C875` | ink / amber `#8A5A00` (gold NEVER text on light — Rule 14) | wallet, package, commissions |
| Network | indigo | `#4F46E5` | `#4338CA` | referrals, levels, community |
| Achievement | purple | `#7C3AED` | `#6D28D9` | certificates, leaderboard, rewards |
| Streak | orange | `#EA580C` | `#C2410C` | streaks, momentum urgency |
| Status | cyan | `#0891B2` | `#0E7490` | webinars, KYC, statuses, feeds |

**De-cluster law:** no two same-accent cards adjacent in a grid; compose rows to alternate.

## §2. The recipe (CSS: `app/globals.css` "GoSkilled VIBRANT CARD SYSTEM v1.0" block)

- **Canvas** `.gs-vibrant` — soft aurora light-spots (single top-left light source). Opt-in per surface.
- **Soft card** `.vh-card.vh-soft.vh-accent-*` — accent gradient-tinted BODY (light→deeper of the
  same accent, consistent saturation range; `color-mix` with flat-tint fallback for old WebViews —
  never a bare surface), gradient icon plate (`.vh-plate-grad`), dual accent-tinted shadows +
  inner sheen, 1.75rem radius, gradient top bar.
- **Focal identities** `.vh-bold` (use on the 2–4 most important cards only): emerald (Progress),
  **gold-vault** (deep emerald-charcoal + gilded sheen + metallic `.vh-gold-num` numerals —
  gradient-clipped text with solid gilded `#E6C875` fallback), indigo (network), royal-purple
  (achievement). White/gilded text — AA on every fill.
- **Champagne gold** — luxury metallic: warm `#A67C00/#B8860B → #E6C875` gradients, bright top-edge
  sheen, warm dark-amber shadow. Never a flat yellow fill; never gold text on light.
- **Hero/banner** `.vh-hero` / `.vh-banner` + glass `.vh-hero-chip` — deep gradient bands, white AA text.
- **Motion** — entrance stagger (`.dc-enter` + delay), hover lift + scale 1.02 + accent glow +
  border brighten + icon plate micro-pop; `CountUp` on NON-money numbers only (money is STATIC —
  DecisionCard §7); `AnimatedRing` fill-in on mount. All `prefers-reduced-motion`-gated.
- **Low device tier flattens everything**: solid fills, plain shadows, no blur/glow/clip-text/motion.

## §3. Components (canonical, promoted)

- `components/cards/decision/vibrant-metric-card.tsx` — **VibrantMetricCard**: icon plate · caps
  label (+ honest `live` Spark) · big `dc-number` value (+`numClassName` for `vh-gold-num`) ·
  mini-viz slot · honest delta chip / ThreeState caption · whole-card link + focus ring · `bold`
  focal switch · `className` span hooks.
- `components/data/animated.tsx` — **CountUp** (non-money only) + **AnimatedRing** (client, tier +
  reduced-motion aware).
- `components/data/mini-bars.tsx` — **MiniBars** (real series; zeros = honest stubs).
- Existing viz (`ProgressRing`, `HeatStrip`, `AreaChart`, `NetworkNodes`, `Spark`) slot in unchanged.

## §4. Non-negotiables carried into every vibrant surface

Honesty: real/honest-zero data only; earn accents render only behind the existing eligibility fork
(DR-040/DR-038); DR-043 recorded-not-payable copy; `safeMoney`/`DataValue` for every ₹; money never
animates; no fabricated deltas/series (omit the chip instead). Performance: budget-Android <2s,
device-tiered with the low-tier flatten above. WCAG AA on every colored/gold/dark card; color never
the only signal. Nav v1.1 and all data layers untouched by re-skins.

## §5. Rollout state

- **Slice A (this amendment):** system promoted + LIVE Home re-skinned (banner slot · hero band ·
  vibrant metric row w/ gold-vault earn slot · momentum panels · feed).
- **Slices B/C (next):** Learn dashboard, Earn hub + wallet interiors consume the same components —
  no new CSS expected beyond composition.
- `/design-system/vibrant` remains the rendered reference (now consuming the promoted components);
  retire or repurpose after Slice C.
- The banner slot ships with honest static content; the admin-managed media banner is a separate
  feature build (future scope, founder-directed).

## Change log
- v1.0 — 2026-07-12 (Claude Code, founder-approved v5 sign-off) — promoted the v5 preview into the
  design system: six-accent map, soft/focal recipes, champagne gold, motion + tier laws, canonical
  components, rollout plan.
