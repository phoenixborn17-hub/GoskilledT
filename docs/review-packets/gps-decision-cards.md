# Review Packet — Decision Card & Dashboard Experience (Design Sprint v1.0)

- **Branch:** `gps-decision-cards` (off `main` @ `dd2dd88`)
- **Commits:** `49f5296` (spec) · `1065edd` (build)
- **Tier:** **B** (card architecture + interaction + visual identity; no money/PII/architecture change). Render-reviewed by founder + steward + Fable per the spec.
- **GATE:** **PARKED — not merged. `main` untouched.** This is **pass 1 of a render-review loop** — the spec expects **2–3 refinement passes on the rendered `/design-system` before lock**. Awaiting review feedback (and the founder **"ye alag hai"** sign-off) before any further pass or merge.
- **Spec:** `DecisionCard_System_v1.0` (extends Experience System §10/§10.2; no architecture reopen).

---

## 1. What was built (render pass 1)

The Phase-1 stat cards evolved into **Decision Cards** — each answers Status · Progress · Next Action · AI nudge · a tiny viz in one glance.

- **`DecisionCard` base shell** — shared GoSkilled soul: embedded (non-floating) icon plate, label + optional badge (LIVE/NEW/🔥→Lucide Flame, **zero emoji**), a hero/viz zone, an in-card **AI line (real trigger only; omitted when none — D-29)**, exactly **one CTA**, and the **whole card clickable**. Honest states built in (loading skeleton; calm error+retry rendered as a non-link surface).
- **7 distinct family variants** (not one template): **Continue-Learning** (progress ring) · **Wallet-Earn** (ledger area-line; money static+charcoal) · **Network** (mini network-nodes) · **Rewards** (milestone track + tier medallion) · **Streak** (flame + glow) · **Progress** (semicircle gauge) · **Analytics-wide** (gradient area chart).
- **Richer viz** (`components/data/`): `AreaChart` (gradient fill + draw-in + last-point highlight), `SemicircleGauge`, `MilestoneTrack`, `NetworkNodes`, `Flame`, `TierBadge` — all inline SVG, real data only, ≥3-points rule enforced.
- **Bento hierarchy** (`bento.tsx`): hero (2-col) · primary (1) · secondary (1) · wide (full); stacks on mobile, hero first.
- **Premium paper-layer depth + motion, ALL device-tiered** in `globals.css`: top accent line · subtle radial tint · soft **accent-coloured** ambient shadow · ~5% top reflection · hover lift/icon-animate; load stagger · chart draw-in · badge pop · flame glow. Every effect stripped under `:root[data-device-tier="low"]` (one source, `lib/device-tier`, §C).

---

## 2. Acceptance (DecisionCard_System §71) — status

| Criterion                                           | Status     | Evidence                                                                      |
| --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Distinct per-family layouts (not one template)      | ✅         | 7 family components, each own hero + signature viz                            |
| Real Lucide icons, **zero emoji**                   | ✅         | embedded accent plates; the "hot" badge uses a Flame glyph                    |
| Every card: AI line (when real) + action + tiny viz | ✅         | AI omitted when no trigger (verified in showcase + test)                      |
| Bento hierarchy (varied sizes)                      | ✅         | hero/primary/secondary/wide — verified at 1360px                              |
| Premium depth that **degrades on low tier**         | ✅         | live: `data-device-tier="low"` → radial tint + reflection removed             |
| Perf gate held on throttled budget-Android          | ◑ deferred | formal <2s recapture = prod build (Phase 6); see §4                           |
| Money static + `safeMoney` (never ₹0)               | ✅         | Wallet card static charcoal; fail-safe shows Retry (test + showcase)          |
| D-29 honest · WCAG AA · reduced-motion              | ✅         | AI real-only; accents text-safe; motion `prefers-reduced-motion` + tier gated |

---

## 3. Verification

```
npx tsc --noEmit                                   → exit 0 (clean)
npx prettier --check <changed>                     → all clean
npx eslint <decision dirs>                         → 0 errors, 0 warnings
npx vitest run tests/decision-cards.test.tsx       → 9 passed
npx vitest run --exclude **/*.integration.test.ts  → 49 files, 373 passed
```

**Browser (`/design-system`, next-dev):** no console errors. Verified live:

- **Depth recipe resolves** — colored ambient shadow `rgba(19,126,73,…)`, radial tint, color-mix icon plate `color(srgb … / 0.14)`.
- **Device-tier degradation** — under `data-device-tier="low"`, card `background-image: none` + `::after` reflection `display:none` (rich effects stripped).
- **Bento hierarchy** at 1360px — hero (2) + 2 primary + 4 secondary + wide.
- **Honest states row** — money-fail-safe ("Couldn't load · Retry", never ₹0), AI line omitted when no trigger, loading skeleton, calm error+retry.

Screenshots captured in session (bento + honest states).

---

## 4. Performance note (honest)

The dev-mode FCP on `/design-system` (~5.2s) is **not the perf gate**: it is webpack-dev, unminified, and renders the _entire_ component gallery (not a real dashboard). The spec itself notes dev over-reports and the formal recapture needs a prod build — **the <2s throttled budget-Android gate is owned by Phase 6 (U7)**. Structural perf properties here are sound: **inline SVG only (no chart lib on the critical path)**, all rich effects device-tiered off on low-end, no blocking JS, count-up on non-money only. Recommend the formal recapture run against a real workspace dashboard on a prod build.

---

## 5. Decisions (for review)

1. **On-brand accent palette** — families use green / gold / charcoal-neutral / info(blue) only. **Streak stays gold-warm (not orange)** to hold brand discipline; the flame viz + glow carry its distinctiveness. Gold accent text uses `#b87a00` (AA amber), never `#edc825` (Rule 14).
2. **Whole-card clickable** — the card is the `<Link>`; the CTA is a **visual affordance (styled span)**, not a nested anchor (valid a11y, no nested interactives). Error state renders as a non-link `<div>` so the retry button is the only control.
3. **AI line = real-trigger-only** — passed as a prop; `null`/absent omits the block entirely. The showcase demonstrates both present and absent; no fabricated nudges (D-29).
4. **color-mix / arbitrary `[color:var(--card-accent)]`** — used for accent tints/strokes so families theme from one `--card-accent` var; verified rendering. Degrades fine (these are flat, not "rich" effects).

---

## 6. Render-review asks (this is the loop — expect 2–3 passes)

Please review the rendered `/design-system` (top two sections) and steer pass 2:

1. **Depth level** — is the paper-layer depth (accent line + tint + colored shadow + reflection) right, too much, or too subtle?
2. **Per-family distinctiveness** — does each family read as its own thing, or do any two feel too similar? Any family that wants a _different_ signature viz?
3. **Hierarchy** — does the bento make the eye land on the hero first? Are primary/secondary weights right?
4. **Motion** — draw-in / stagger / glow / count-up — more, less, or right? (all currently subtle + tier-gated).
5. **The bar** — does it clear **"ye alag hai"** (feels like GoSkilled's own product, not a SaaS template)? If not, what's missing?

---

## 7. Self-assessment (5 lines)

1. **Distinct-not-template achieved** — 7 families with their own layouts + signature viz, unified by one shell/soul; verified rendering at desktop + mobile widths.
2. **All locks held** — money static + fail-safe, gold-decorative/charcoal-numbers, D-29 honest AI, WCAG-safe accents, every rich effect device-tiered (proven stripped on low tier).
3. **Honest about perf** — dev FCP is not the gate; formal throttled recapture is Phase-6 prod-build work; structural properties (inline SVG, no chart lib, tiered effects) are sound.
4. **Clean** — tsc/lint/prettier green; 9 new render tests + 373 non-integration tests pass; `main` untouched.
5. **Deliberately pass 1** — this opens the render-review loop; I've listed concrete steering questions and expect 2–3 refinement passes before lock. No merge sought yet.
