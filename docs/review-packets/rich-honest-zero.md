# Review Packet — Rich-Honest-Zero rework (ThreeState binding law)

**Branch:** `gps-rich-zero` (off `main`) · **Tier:** B (presentation-only; no money/eligibility logic touched)
**Status:** BUILT · PARKED · **NOT MERGED** (GATE). Diff: `rich-honest-zero.diff` (3 files, +139 / −84).
**Law:** `docs/specs/ThreeState_RichHonestZero_Principle.md` (BINDING) — premium = rich UI **+** honest data;
supersedes the earlier "zero-data ⇒ suppress cards + show only a getting-started" approach.

## What changed

Across **Home · Learn · Earn**, the zero-state no longer replaces the dashboard with a getting-started
screen. The **FULL rich dashboard renders in every state**; new users see honest zeros with a motivating
**unlock micro-state** on each card, plus **ONE** getting-started strip (not the whole page).

- **Home** (`app/dashboard/home/page.tsx`): removed the `lifecycleNew ? <ZeroData> : <full>` fork — the
  full stack (Today's Summary · Quick Actions · Priorities · Enter-Workspaces · Share) always renders;
  a compact `GettingStartedStrip` is the one extra element for new users. **Streak now always shows** —
  at 0 it's an honest "0 · Complete a lesson today to start your streak" instead of being hidden.
  (Money placement unchanged — §F/DR-043: no ₹ on Home pre-D-01; money lives on Earn.)
- **Learn** (`app/dashboard/learn/page.tsx`): removed the fork — `Loaded` always renders. Stat cards
  carry unlock hints at 0 (Courses "Enroll to begin" · Progress "Complete a lesson to grow this" ·
  Certificates "Finish a course to earn one" · Streak "Start today"). Continue hero gains a "start
  learning" fallback so the slot is never empty.
- **Earn** (`app/dashboard/earn/page.tsx`): the eligible-but-no-referrals branch is folded into
  `FullDashboard` — **every ELIGIBLE user gets the full dashboard at honest zero** (₹0 held/earned,
  0 friends) with unlock hints ("Ready to receive commissions" · "Earn when a friend joins & buys" ·
  "Invite your first friend") + a getting-started strip when referrals = 0.

## Honesty / boundary locks (unchanged — challenge-with-logic)

- **NotEligible stays** — it's an ELIGIBILITY fork (§D / DR-038: a non-purchaser must never see
  share-to-earn), NOT a zero-data state. The law is about zero-DATA, not eligibility.
- **`safeMoney` intact** — real ₹0 is honest; a failed load still renders the fail-safe (never ₹0-on-error).
- **Available anchors only when > 0** (§D) — kept. **No money logic, no eligibility, no DR-038 masking,
  no payout gate touched** — this is pure presentation. D-29: no fabricated data; the "unlock" copy
  motivates, it never promises income.

## Verify

- `tsc` clean · `eslint` clean · `prettier` clean · **full suite 459/459 green** (incl. money non-regression).
- **Visual proof** (screenshots): a zero-data + eligible user shows the FULL Home/Learn/Earn dashboards at
  honest zero with unlock micro-states + one getting-started strip each — no suppression. (Verified locally
  on the branch via a real session.)

## Three-state coverage (New / Active / Power) — key cards

| Card | New (0) | Active | Power |
|---|---|---|---|
| Learn: Progress/Certs/Streak | 0 + unlock hint | real % / count | trend/sparkline |
| Home: Streak | 0 "start today" | day count | at-risk nudge |
| Home: Enter-Workspaces | 0% / 0 invites | real snapshot | network viz |
| Earn: Held/Total/Friends | ₹0/0 + unlock hint | real ₹ / count | charts + rewards |

## STOP — parked for steward review (Tier-B, no merge)
