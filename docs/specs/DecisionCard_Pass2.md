# Decision Cards — Pass 2 (render-review changes)

> Steward code-review + **Fable second-opinion** on render pass 1. All within locks (perf gate · device-tier · D-29 · gold-rule · DR-034/035 · budget-Android · Sora/Inter · light-only). Mostly **subtraction**; **NO architecture reopen**. Same branch `gps-decision-cards`.
>
> **Verdict:** premium + coherent, above template in craft — **not yet "ye alag hai."** Cause: the shared header (full-width 3px top line + tinted icon-chip + UPPERCASE label) is the industry template signature, and the hero is the weakest card. Fix = an ownable signature ("the Spark") + hero dominance + de-twinning + 2 correctness bugs.

## P0 — must (the "ye alag hai" levers + correctness)
1. **Adopt "the Spark" as the GoSkilled signature; delete the full-width 3px top line.** Promote the area-chart last-point highlight (accent dot + soft halo) to **one mark on EVERY card** meaning "where you are now / your live edge": ProgressRing/SemicircleGauge → arc endpoint · MilestoneTrack → target node · NetworkNodes → the "you" node · Flame → the glow (standardize ratios) · Wallet ledger → last point. Semantic (not decorative), ~zero perf, D-29-clean, static on low tier. This replaces the top line as the recurring signature.
2. **Fix hero type inversion (hierarchy P0).** Hero (Continue-Learning) is currently the typographically weakest card. → course title Sora **text-h2** (md:display if Hinglish titles survive), ring **72→96–112px** (strokeWidth ~10), hero-only stronger tint (`--card-tint` .05→.09), more vertical presence in `bento.tsx`. The eye must land on the hero, not the Wallet ₹ (protects DR-034/035 learning-first).
3. **Real Rewards medallion per tier** (`tier-badge.tsx`) — currently an icon plate that twins the card icon. Give a distinct inline-SVG **shape** per tier (Contributor notched ring · Mentor double ring · Champion rayed). Most screenshot-able element; ~30 lines each, no perf cost.
4. **`color-mix()` fallback** (`globals.css` icon-plate, `tier-badge.tsx`, `flame.tsx`) — add a plain `rgba()` declaration before each `color-mix`; else icon plates/badges render with **no background** on Chrome/WebView <111 (common budget Android). Correctness on the target device.
5. **AreaChart spark distortion** (`area-chart.tsx`) — `preserveAspectRatio="none"` squashes the last-point circle into an ellipse in narrow containers; fix (explicit width at the Wallet call-site or a non-scaling dot) so the Spark never renders squashed.

## P1 — should
6. **De-twin Wallet vs Analytics** (both use `AreaChart`): Analytics **owns the gradient area fill**; Wallet becomes a **line-only "passbook rule"** ledger (render AreaChart with `fill={false}`). **Cap gold at 2 per bento** (sample has 4/9 gold-topped).
7. **Depth polish:** shrink the 34%/0.55 top reflection → a **crisp 1px inner top highlight** (`inset 0 1px 0 rgb(255 255 255/.6)` in the shadow stack, drop the `::after`); let the radial tint breathe (green .05→.07); **accent-tinted border** (`color-mix`, with fallback). **Keep** the colored ambient shadow + single top-left light source (best ingredients).
8. **Signature type:** big numbers Sora, tracking −0.02em, **de-emphasized ₹/units** (smaller/lighter, slightly raised — the Stripe move; money stays static + charcoal). Replace the generic UPPERCASE Inter label → **sentence-case Sora + a small accent tick** (rhymes with the Spark). One `.dc-number` utility.
9. **Data-driven viz:** Streak flame glow scales with `min(days,30)` (real data); SemicircleGauge gains milestone ticks (de-twins from Continue's ring); NetworkNodes shows this-month joins as ringed satellites.
10. **Motion trim:** entrance ~360ms + capped stagger (~300ms total) inside the <2s gate; draw-in via `pathLength={1}` (fixes the hardcoded `dasharray:640` dead-time on short paths).

## Protect (do NOT "improve")
AI line staying info-blue across all families (one AI voice) · the honest-state system (error=non-link retry · `safeMoney` · ≥3-points "graph appears after…") · the colored ambient shadow + single top-left light source.

## Needs founder render-pass confirmation
Hero dominance · reflection visibility · gold balance · **does it now clear "ye alag hai"?**

## Change log
- v1.0 — 2026-07-10 (Opus steward + Fable second-opinion) — prioritized pass-2 for the Decision-Card render-review loop; within locks, subtraction-first, no architecture reopen.
