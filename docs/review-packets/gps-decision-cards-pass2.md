# Review Packet — Decision Cards **Pass 2** (render-review)

- **Branch:** `gps-decision-cards` (off `main` @ `dd2dd88`) · **Commits:** pass-1 `1065edd` · pass-2 spec+build `e8b52b7`.
- **Tier:** B (card identity/interaction; no money/PII/architecture change). **GATE: PARKED — not merged. `main` untouched.**
- **Spec:** `DecisionCard_Pass2.md` (steward code-review + Fable second-opinion). This is **pass 2 of the render-review loop** — awaiting the next review + the founder **"ye alag hai"** confirmation.

The pass-1 verdict was _premium + coherent but not yet "ye alag hai"_ — the shared header (top line + tinted chip + UPPERCASE label) read as the industry template, and the hero was the weakest card. Pass 2 replaces that with an ownable signature + hero dominance + de-twinning + 2 correctness fixes. **Subtraction-first, within all locks.**

## P0 — done

| #   | Change                                                                                               | Status / evidence                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **"The Spark"** (accent dot + breathing halo) on every card's live edge; **delete the 3px top line** | ✅ `spark.tsx` `SparkDot`; wired into ProgressRing (arc-end), SemicircleGauge (arc-end), NetworkNodes (you-node), MilestoneTrack (target), AreaChart (last-point). Live: `::before content:none`; **7 spark halos** on the page |
| 2   | **Hero type inversion fix**                                                                          | ✅ Continue title Sora `text-h2 md:text-display`, ring **104px**+Spark, hero-only tint (.11) + `min-h`. Live: the eye now lands on the hero, not the Wallet ₹ (protects DR-034/035)                                             |
| 3   | **Real per-tier Rewards medallion**                                                                  | ✅ `tier-badge.tsx` inline-SVG: Contributor notched ring · Mentor double ring · Champion rayed sunburst + star centre — distinct from the card icon                                                                             |
| 4   | **`color-mix()` → precomputed rgba**                                                                 | ✅ icon-plate/border/tint/glow are plain `rgba()` per accent class; flame uses `rgba()`. No bare surfaces on WebView <111                                                                                                       |
| 5   | **AreaChart Spark distortion**                                                                       | ✅ Spark is now an HTML overlay dot (always round despite `preserveAspectRatio="none"`); Wallet also passes explicit `width`                                                                                                    |

## P1 — done

| #   | Change                                            | Status                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | De-twin Wallet vs Analytics + cap gold at 2/bento | ✅ Wallet `fill={false}` line-only passbook; Analytics owns the gradient area. Sample bento gold = Wallet + Rewards (2); Streak → green, **flame stays warm (decoupled)**                                                                      |
| 7   | Depth polish                                      | ✅ dropped the 34% `::after` reflection → crisp **1px inner top highlight** in the shadow stack; green tint .05→.07; **accent-tinted border** (`rgba`, live `rgba(19,126,73,.22)`). Kept colored ambient shadow + single top-left light source |
| 8   | Signature type                                    | ✅ `.dc-number` (Sora, −0.02em) on big numbers; `.dc-unit` de-emphasises ₹/units (raised/smaller/lighter — money stays static+charcoal); labels now **sentence-case Sora + accent tick**                                                       |
| 9   | Data-driven viz                                   | ✅ flame glow scales with `min(days,30)`; gauge gains milestone ticks; NetworkNodes rings the newest `thisMonth` satellites                                                                                                                    |
| 10  | Motion trim                                       | ✅ entrance 520→**360ms**, stagger capped; draw-in via **`pathLength={1}`** (no dead-time on short paths)                                                                                                                                      |

## Protected (left untouched, per spec)

AI line stays info-blue across all families (one AI voice) · honest-state system (error=non-link retry · `safeMoney` never ₹0 · ≥3-points rule) · colored ambient shadow + single top-left light source.

## Verification

```
tsc --noEmit → 0 · prettier → clean · eslint (decision dirs) → 0/0
vitest tests/decision-cards.test.tsx + design-system → 26 passed
vitest --exclude integration → 49 files, 373 passed
```

**Browser (`/design-system`, 1360px + 720px):** no console errors. Verified: top line gone; hero dominates; 7 Sparks; per-tier medallions; Wallet passbook vs Analytics gradient; 2 gold cards; accent-tinted border; **low-tier degradation** (`data-device-tier="low"` → radial tint `none`, colored shadow flattened, Spark halo animation `none`). Money static + fail-safe intact. Screenshots captured in session.

## Perf

Unchanged posture (honest): dev FCP is not the gate; the Spark/medallion/ticks are ~zero-cost inline SVG; motion trimmed; all rich effects tier-gated. Formal <2s throttled budget-Android recapture remains Phase-6 prod-build work.

## Needs founder render-pass confirmation (spec §"Needs founder confirmation")

1. **Hero dominance** — does the eye land on Continue-Learning first now?
2. **Reflection visibility** — is the 1px inner highlight the right amount (vs the old 34% reflection)?
3. **Gold balance** — 2 gold per bento read right?
4. **The bar** — **does it now clear "ye alag hai"?** If not, what's the remaining gap?

## Self-assessment

1. Executed the full P0+P1 list within locks; subtraction-first (deleted the template top line + heavy reflection).
2. The Spark is now the recurring, semantic signature; the hero clearly dominates; families are further de-twinned (medallion, passbook-vs-gradient, green streak + warm flame).
3. Correctness fixes landed (color-mix fallback for old WebView; round Spark).
4. All locks held + proven (device-tier degradation, money static+fail-safe, gold-rule, D-29, WCAG-safe accents); green suite.
5. Deliberately pass 2 — parked for the next review; no merge sought until the founder's "ye alag hai" sign-off.
