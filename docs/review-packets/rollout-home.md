# Review Packet — Vibrant Rollout · Slice A: System Amendment + LIVE Home (Tier B, PARKED)

**Branch:** `gps-rollout-home` (off `main@b83d1b9`) · **Date:** 2026-07-12 · **Status: PARKED — no merge**
**Directive:** founder-locked v5 rollout, Slice A (design-system amendment + Home).
**Spec:** `docs/specs/Vibrant_CardSystem_Amendment_v1.0.md` (new, mirrored per DR-027 — amends Experience System §2/§10.2 + DecisionCard §5).
**Tier:** B — display re-skin + design-system promotion; zero data/money/eligibility/nav logic change. **Steward review requested**; merge only on explicit authorization (GATE).

---

## 1 · What changed (by commit)

| Commit    | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `7673a13` | **PROMOTE, don't copy** — the v5 preview system becomes the design system: `.vibrant-home` scope class renamed to the reusable **`.gs-vibrant`** canvas; the `.vh-*` recipe in `globals.css` re-headed as **"GoSkilled Vibrant Card System v1.0"** (canonical); **`VibrantMetricCard`** promoted to `components/cards/decision/`, **`CountUp` + `AnimatedRing`** to `components/data/animated.tsx`, **`MiniBars`** to `components/data/mini-bars.tsx`. The `/design-system/vibrant` preview now consumes the promoted pieces (its mockup-local copies deleted) — single source of truth; Slices B/C just import. |
| `f8cfcc2` | **LIVE Home onto the system** — banner slot (honest static browse promo; admin-managed media = separate future build) · `vh-hero` greeting band (greeting + spark line + real glance chips) · metric row on `VibrantMetricCard` with the v5 de-clustered accents (bold-emerald Progress w/ CountUp+AnimatedRing · orange Streak w/ heat · purple Certificates · slot-4 fork: **gold-vault** recorded w/ metallic `vh-gold-num` STATIC money / **bold-indigo** network / cyan webinar-milestone) · momentum panels + For-you feed (Home-owned components) onto the soft recipe · spec amendment doc.              |

**Diffstat vs main:** 9 files, +498/−229 (2 files are renames from the preview folder). Bands ③ Continue-hero, ⑥ workspaces, ⑦ Store, ⑧ Announcements/Share intentionally keep the dc-recipe (calm support under the vibrant first viewport; Slices B/C extend).

## 2 · Honesty checklist (HARD LOCKS)

- [x] **Eligibility fork BYTE-LEVEL intact** — `EarnSlot` still branches on the same `summary.earn` discriminated union (`recorded`/`network`/`hidden`); only the card component + accent changed. `git diff main...HEAD -- lib modules` → **EMPTY** (no loader, money, eligibility, or nav logic touched; `lib/nav/workspaces.ts` untouched — Nav v1.1 byte-identical).
- [x] **Money static** — the gold-vault card renders `<DataValue value={safeMoney(...)}/>` (metallic _styling_ via `vh-gold-num`, no animation); `CountUp` only on progress/streak/certificates/lesson totals; DR-043 captions verbatim from Slice 1 ("Recorded to your wallet — payouts open at launch", never "ready to withdraw").
- [x] **Live-verified (dev server, non-eligible test user):** page renders the network fork with **zero `₹` characters anywhere** and no `vh-gold-num`; banner/hero/metric row/momentum/feed all present; **zero console errors** (no hydration issues).
- [x] **ThreeState/honest-zero** — all captions, unlock shells, and the "all caught up" empty preserved; deltas render only when a real weekly delta exists; the banner slot carries real, honest copy (a browse CTA — no fabricated promo claims, no income copy).
- [x] Getting-started strip, nudge rules, feed events: unchanged logic.

## 3 · WCAG AA checklist

- [x] Soft tinted cards: ink / accent-text on light tints — all accent text colors chosen ≥4.5:1 on white-tinted fills (amber `#8A5A00`, indigo `#4338CA`, purple `#6D28D9`, orange `#C2410C`, cyan `#0E7490`, green `#0C5A34`).
- [x] Dark focals: white on `#137E49`-and-darker (≥4.6:1), gilded `#E6C875` numerals on the vault's `#161C16→#0C4A2C` (≈9:1); clip-text has a solid gilded fallback.
- [x] Gold NEVER text on light (champagne fills + ink text; amber only as text-safe accent).
- [x] Color never the only signal (icons + labels everywhere); viz slots carry aria-labels; whole-card links keep visible focus rings; banner/hero text on deep fills is white ≥AA.

## 4 · Perf note

- Zero new libraries; the only client additions on Home are the tiny `CountUp`/`AnimatedRing` (already tier-gated, reduced-motion-gated, no-op on low tier). Page JS: `/dashboard/home` 1.74 kB (was ~1.6 kB) — well inside budget.
- All gradients/glass/glow/motion flatten on `data-device-tier="low"` (single CSS block); `color-mix` has flat-tint fallbacks so old WebViews never render a bare card.
- Same data reads, same Suspense streaming, zero-CLS skeletons unchanged → budget-Android <2s posture unchanged.

## 5 · Green checklist

`tsc` clean · `eslint` clean · `prettier` applied · **`npm test` 483/483** · `next build` green (`/dashboard/home` + `/design-system/vibrant` both compile; staging-escape env as on prior slices).

## 6 · Before / after (Home)

|               | Before (Slice 1 dc-skin)                     | After (Vibrant v1.0)                                                                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Top           | greeting text + gold Badge                   | **banner slot** + deep-green **hero band** (glass chips w/ real streak/progress)                             |
| Metric row    | 4 white dc MetricCards (green×3 + gold/info) | 4 colorful VibrantMetricCards — bold emerald / orange / purple / (gold-vault·indigo·cyan fork), de-clustered |
| Money         | plain charcoal number                        | metallic gilded numerals on the vault focal — still STATIC `safeMoney`                                       |
| Momentum/feed | white ChartPanels + WidgetContainer          | soft emerald/champagne glow-chart panels + soft cyan feed                                                    |
| Motion        | ring transition only                         | + count-up (non-money), ring fill-in, stagger, lift/scale/glow hover                                         |

Screenshot caveat (same environmental pane issue as all prior slices — screenshots wedge intermittently): render verified via full server-HTML assertions + computed-style checks on prior identical CSS; the founder has already reviewed these exact pixels as v5 on staging.

## 7 · Known limitations / follow-ups (not blockers)

1. Bands ③/⑥/⑦/⑧ still on the dc-recipe by design — Slices B/C (Learn, Earn/wallet) extend the system; a Home second pass can vibrant-ize the Continue hero then if wanted.
2. `/design-system/vibrant` is now a thin consumer of the promoted system — retire or repurpose after Slice C.
3. Admin-managed banner (image/GIF/video + URL) = separate feature build; the slot ships honest static content.
4. The gold-vault + indigo focals on live Home render only for eligible/visible-not-eligible users respectively — staging demo account exercises them.

## 8 · Self-assessment (5 lines)

This is a promotion + re-skin with a deliberately empty logic diff: `lib/` and `modules/` are untouched, the eligibility union and every honesty string are the same bytes, and the only new behavior is presentation motion that is already tier- and reduced-motion-gated. The system now lives in three canonical components + one CSS block + a mirrored spec amendment, so Slices B/C are composition work, not design work. The riskiest surface — money — is provably static (DataValue/safeMoney, no CountUp on any ₹ path). Visual risk is low because the founder signed off these exact pixels as v5; the remaining unknown is taste on the live-data edge cases (honest zeros in vibrant dress), which staging will show. Fully reversible by dropping the branch.

**PARKED on `gps-rollout-home` — awaiting steward Tier-B review + explicit merge authorization.**
