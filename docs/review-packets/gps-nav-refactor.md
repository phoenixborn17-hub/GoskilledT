# Review Packet — Nav Shell Refactor (Nav_Workspace_Architecture v1.1, LOCKED)

- **Branch:** `gps-learn` (has Phase 3 Learn) · **Commits:** `251bb04` (nav refactor) · `b063d58` (founder FeatureVisibility spec amendment, preserved separately).
- **Tier:** B (shell refactor; no money/PII/architecture change). **GATE: PARKED — not merged. `main` untouched.**
- **Spec note:** `Nav_Workspace_Architecture_v1.1` is **not mirrored in `docs/specs/`** (DR-027) — executed from the LOCKED directives you provided inline. Worth dropping the doc in-repo.

**Shell refactor, not a rebuild** — routes/pages unchanged, money untouched, D-29 honest, device-tiered, WCAG.

## 1. One nav system

- **Thin persistent switcher** — **Home · Learn · Earn · Account** (desktop: left **icon-rail** 72px, themed active; mobile: **bottom bar**). No Explore, no Guru.
- **Contextual sidebar** — lists **only the active workspace's pages** (desktop `aside`; mobile drawer = overflow). The old **all-workspaces list + separate in-workspace sub-nav are deleted** (no two nav systems).
- Active workspace from **route prefix**; **theme per workspace** (`[data-theme]`). Mobile drawer opens the contextual pages only.
- **Persistent Share** in the top bar (+ the desktop rail); **Notifications = top-bar bell**.

## 2. Guru removed everywhere

- Removed from the shell (top-bar Guru entry + Guru drawer), the **Learn dashboard** (in-context chips + "Ask Guru" quick action), and the **Progress** page (Guru chip). No `guru=1` deep-link is generated anywhere.
- **Tutor code kept** behind `guruEnabled()` (`lib/flags.ts`, returns `false`); the `GuruPanel` in the player is gated by the flag — **no routing change**, flip to restore.
- Added Account **"Support"** → `/contact` (Help/FAQ · Contact · WhatsApp live on the existing page).

## 3. Dedup + renames

| Change                                      | How                                                                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KYC = Account only**                      | Removed from Earn nav; route `/dashboard/earn/kyc` unchanged; `activeWorkspaceKey` maps it to **Account** so the switcher shows Account.                                                             |
| **Wallet includes Withdraw**                | Earn nav shows **Wallet** only (withdraw lives on the wallet page — unchanged).                                                                                                                      |
| **My-Team → My Network**                    | Earn nav label renamed.                                                                                                                                                                              |
| **Explore → Learn "Browse" + Home "Store"** | Explore workspace removed; Learn sidebar gains **Browse** (`/courses`); Home gains a **first-class "Browse the Store" card** (`/courses`).                                                           |
| **Contextual sidebars (per LOCKED spec)**   | Learn: Dashboard·My Courses·Certificates·Webinars·Browse·←Home. Earn: Dashboard·My Network·Leads·Wallet·Commission Structure·←Home. Account: Profile·KYC·Support·←Home (Logout in the profile menu). |

## Verification (live, authoritative DOM inspection)

- **Learn** — `data-theme="learn"`; switcher = Home·Learn·Earn·Account; contextual sidebar = **Dashboard·My Courses·Certificates·Webinars·Browse·←Home**. **Zero Guru/Explore** anywhere.
- **Earn** — `data-theme="earn"`; sidebar = **Dashboard·My Network·Leads·Wallet·Commission Structure·←Home**; **KYC absent** from Earn nav.
- **Account** — `data-theme="neutral"`; sidebar = **Profile·KYC·Support·←Home**; Log out in the profile menu.
- **Home** — `data-theme="neutral"`; **no contextual sidebar** (the hub); the **"Browse the Store"** card renders; Share in the top bar.
- Screenshot of Home captured (icon-rail switcher + Store card + zero-data getting-started). **No console errors.**

```
tsc --noEmit → 0 · prettier → clean · eslint (changed) → 0/0
vitest --exclude integration → 373 passed   (presentation-only; money/LMS untouched)
```

## Route-mapping decisions (flagged — routes unchanged)

- **Certificates** (Learn) → `/dashboard/progress` (where per-course progress + certificates live); the page heading is now **"Progress & Certificates"** for coherence. A dedicated certificates route would be a future build.
- **Webinars** → `/webinar`, **Browse** → `/courses`, **Support** → `/contact` (existing public pages — they navigate out of the app shell, as before).
- **KYC** route stays `/dashboard/earn/kyc` (under the existing earn layout, which still applies its gold theme + sub-tabs); the _switcher_ now reads Account for it. Minor wrapper artifact until a future move.
- **Security / Settings** (from the spec's Account list) are **omitted** — no routes exist yet and I won't invent them (no dead links, D-29); the Profile page covers settings. Flag for a future Account build.
- **Rewards / Leaderboard** are not in the Earn contextual sidebar (per the LOCKED list); their routes remain, reachable from within the Earn dashboard content.

## Locks held

Re-skin/refactor in place (no route/business-logic edits; player URL + completion logic untouched) · money math untouched · D-29 (no dead links; no fake data) · device-tiered · WCAG (labelled controls, focus rings, ≥44px) · zero money/LMS non-regression.

## Note

The `FeatureVisibility_System_v1.0.md` **compliance-reframe** edit was found **unstaged in the working tree** (founder-authored). I preserved it as its **own commit** (`b063d58`) rather than bury it in the refactor — flagging so you know it's captured.

## Self-assessment

1. Executed the LOCKED spec exactly — verified each workspace's switcher + contextual sidebar against the spec lists live.
2. Guru fully removed from nav/chips; tutor code preserved behind a flag with no routing change.
3. Dedup/renames applied; route-mapping compromises (Certificates/KYC/Support/Security-Settings) documented honestly — no dead links, no invented routes.
4. Green (tsc/lint/prettier; 373 tests); presentation-only, money/LMS untouched.
5. Parked for review — no merge; the founder spec amendment is captured separately.
