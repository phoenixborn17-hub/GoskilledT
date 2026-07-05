# Review Packet — polish-1 Batch 2: §2.6 Signature Moments (#10–14)

**Branch:** `gps-polish-1` · **Tier:** B (marketing/UI; no route or data-model changes) · **Doctrine:** DR-031 polish sprint, DESIGN_DIRECTION v1.0. Five PRODUCT_DEBT rows (#10–14) closed. Each moment is premium-from-first-commit, `prefers-reduced-motion`-gated, and verified in a real browser via the QA session.

**Full suite after Batch 2:** 280 passed / 37 files. tsc + prettier clean.

| #   | Moment                | Commit    | Diff                                             |
| --- | --------------------- | --------- | ------------------------------------------------ |
| 10  | Homepage hero         | `1550b13` | [hero](polish-1-b2-10-hero.diff)                 |
| 11  | Welcome belonging     | `cd6c682` | [welcome](polish-1-b2-11-welcome.diff)           |
| 12  | Purchase success      | `4132fcb` | [purchase](polish-1-b2-12-purchase.diff)         |
| 13  | Referral milestone    | `b3d7136` | [referral](polish-1-b2-13-referral.diff)         |
| 14  | First-lesson complete | `4afc341` | [first-lesson](polish-1-b2-14-first-lesson.diff) |

---

## #10 — Homepage hero (`app/globals.css`)

**What:** Added a static gradient-mesh backdrop to `.hero-aurora` (two faint colour pools → depth even under reduced-motion) and a slow 7s sheen sweep across the payoff word "Kamao." (`.text-brand-gradient`, motion typography). Pure CSS, zero JS, LCP-safe, NO 3D (the 3D slot stays unspent per §2.6).
**Verify:** homepage rendered at 200; `preview_inspect` confirmed `background-size: 220%` + `animation-name: brand-sheen` on the word and the mesh `background-image` on the section; screenshot clean; no console errors.
**Self-assessment:** motion is purposeful (draws the eye to the one payoff word) and gated; mesh benefits reduced-motion users too; no content depends on it; no gold-on-light (green gradient only).

## #11 — Welcome belonging (`app/welcome/page.tsx`, `app/globals.css`)

**What:** A HeartHandshake membership medallion (gold as a _fill_ with a charcoal icon — gold-contrast rule), a soft green→gold glow backdrop, a single gentle halo pulse, and staged `.enter` entrance. Copy unchanged (stays LC #34).
**Verify:** captured in-browser as the QA learner (status 200, no redirect) — medallion + glow + badge + staged entrance render as intended.
**Self-assessment:** "belonging" not "achievement" — calm entrance + halo, no confetti; halo pulses exactly twice then rests; reduced-motion → static medallion, instant content.

## #12 — Purchase success (`app/onboarding/page.tsx`)

**What:** The signature moment is placed **honestly** at the post-purchase onboarding `done` state (the learner has paid and is set up) — confetti + PartyPopper medallion + warm Hinglish + a real "Start learning" CTA. The pre-payment checkout "order created" step was deliberately **left un-celebrated** (celebrating it would imply payment success before it happens — a trust/D-29 concern).
**Verify:** drove `/onboarding` → skip → `done` as the QA learner; screenshot shows confetti + medallion + CTA.
**Self-assessment:** the honesty call is the key decision here — flagging it explicitly for review. Confetti self-guards reduced-motion; card enters via gated `.enter`.

## #13 — Referral milestone (`components/dashboard/referral-milestone.tsx`, `modules/affiliate/milestone.ts`, `lib/affiliate/copy.ts`, `app/dashboard/page.tsx`)

**What:** A derived tier track (1/5/10/25) on the hub Earn card; reached tiers light gold (charcoal text). A one-time confetti fires the first time a new tier is crossed, gated by `localStorage` so it never repeats on reload. **Fully derived** from the real invite count — no new table, no fabricated data. **D-29:** count-only framing, zero earnings/rewards/₹ language (new copy slots are LC #17).
**Verify:** pure tier logic extracted to `modules/affiliate/milestone.ts` and unit-tested (5 tests: boundaries, between-tiers, cap, ascending); zero-state rendered in-browser on the QA hub (0 invites → all tiers outlined, "start" copy).
**Self-assessment:** couldn't live-capture the _reached_ state without seeded invite data — mitigated by unit-testing the exact boundaries that drive it. localStorage failure (private mode) degrades silently (no one-shot, no crash).

## #14 — First-lesson complete (`components/ui/confetti.tsx`, `components/dashboard/lesson-player.tsx`)

**What:** Elevated the shared `Confetti` to a fuller, moment-grade burst (24 pieces, outward drift from centre, mixed ribbon/chip shapes, eased fall) — benefits every completion incl. the Certificate moment. Added a warm first-win banner ("Pehla lesson complete! 🎉") shown **only** on the first-ever completion (`progress.completed === 1`), not on subsequent lessons.
**Verify:** reset the QA learner's course progress (reversible — re-completing lesson 1 restored it) and drove a real first-completion in-browser: banner visible + moment-grade confetti captured mid-fall.
**Self-assessment:** the "first" signal comes straight from existing server progress (`completed === 1`) — no new state; confetti self-guards reduced-motion; banner uses `role="status"` + gated `.enter`.

## Cross-cutting notes

- **No new scope / no route or schema changes** — all five are UI/marketing polish on existing surfaces (DR-031 frozen-scope rule).
- **Reduced-motion:** every effect is gated (`@media (prefers-reduced-motion: no-preference)`) or self-guards inside `Confetti`; reduced-motion users get calm, complete, static surfaces.
- **D-29:** no income/earnings language introduced anywhere; the referral moment is count-only.
- **Gold-contrast rule:** gold used only as fills behind charcoal icons/text, never as text on light.
- **Verification method:** in-browser via the QA session (`scripts/qa-auth-bootstrap.ts`) using throwaway Playwright scripts (removed after use); the one durable a11y assertion suite (`e2e/qa/guru-focus-trap.spec.ts`) came from Batch 1.
