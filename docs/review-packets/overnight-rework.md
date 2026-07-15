# Overnight Rework — Review Packet

**Branch:** `gps-overnight-rework` (cut from up-to-date `main` @ `a7930e0`) · **PARKED, not merged.**
**Session date:** 2026-07-15/16. **Commits:** 7 (`overnight-1` … `overnight-7d`), one per completed
item, each with its own test/typecheck/build verification in the commit message.

**Confirmation: nothing touched `main` or production.** `main` is still at `a7930e037224e822fe6eb0ca45985e681761ef48`
(the same commit it was at when this session started). All 7 commits live only on
`gps-overnight-rework`. No push, no deploy, no merge was performed or attempted.

---

## 1. Before/after, page-by-page

| Surface | Before | After | Commit |
|---|---|---|---|
| `middleware.ts`, `lib/auth/session.ts`, `lib/auth/admin.ts` | `getUser()`'s error silently discarded — a transient Supabase failure (`AuthRetryableFetchError`, network blip) was indistinguishable from "no session" and bounced real logged-in users to `/login` | New `lib/auth/verify-user.ts` classifies the result: session-missing → signed out (unchanged behavior); any other error → `AuthUnavailableError`, never silently signed out. Middleware lets the request through instead of redirecting; dashboard/admin layouts render a retry screen instead of redirecting | `overnight-1` |
| `app/dashboard/error.tsx`, `app/admin/error.tsx` | Did not exist — an error anywhere in a dashboard/admin page crashed to the root 500 page, losing all chrome | Added as per-segment error boundaries (catch errors from pages/actions below the layout; the layout's own chrome stays mounted) | `overnight-1` |
| Earn sidebar (`lib/nav/workspaces.ts`) | Commissions, Referrals, Leaderboard, Rewards existed as routes but weren't listed — reachable only by typing the URL | Added to the sidebar | `overnight-2` |
| Commissions / Referrals / Leaderboard / Rewards / Wallet / KYC / `/checkout` | No way back except the browser Back button | Shared `BackLink` ("← Back to X") added to all 7 | `overnight-2` |
| `/admin/*` (31 files) + `components/ui/card.tsx` | ~220 raw `text-charcoal` / `bg-white` / `border-charcoal/N` / `text-red-*` / `rounded-2xl` instances; flat, motionless stat cards and tables | Migrated to the semantic tokens (`text-ink`, `border-line`, `bg-surface-raised`, `danger`, `rounded-gs-lg`); StatCard/QueueCard get entrance + hover-lift, DataTable rows get hover highlight — all CSS-only, reduced-motion-gated | `overnight-3` |
| Home / About / Contact / Courses+Detail / Packages / Webinar + shared marketing kit (22 files) | Same raw-class debt on the public site | Migrated to tokens; brand/green identity (DR-012) and gold accents deliberately untouched. Audited motion first — found the marketing shell already had thorough scroll-reveal (`.reveal`, `animation-timeline: view()`) baked into the shared `Section` component and staged hero entrance (`.enter`) on every page, all reduced-motion-gated — so no new motion infra was needed | `overnight-4` |
| `/dashboard/profile`, `/dashboard/learn/browse`, `/dashboard/courses`, `/dashboard/progress` | Already on semantic tokens (earlier redesign phases) but not scoped under `gs-vibrant` and had no mount-entrance, unlike Home/Learn/Earn | Added `gs-vibrant` wrapper + `dc-enter` on every Card; added `dc-enter` to the shared `CourseCard` component (benefits every consumer, including Learn/Browse) | `overnight-5` |
| App-wide remainder: `components/ui/*` primitives, checkout, KYC/wallet forms, lesson player, onboarding/register/welcome/verify, gamification, Guru panel, nav shell, PWA prompt, legal-page shells (54 files) | Same raw-class debt scattered app-wide | Migrated to tokens (className-only; legal copy text untouched — only the shell `<h2>` structural classes). Added `scripts/check-color-tokens.ts` (`npm run lint:tokens`) — a grep-guard with a small documented allowlist (fixed-dark admin nav, gold-badge charcoal text per Golden Rule 14, translucent overlay chips, the switch knob) so this debt can't silently regrow | `overnight-6` |
| Account → Settings → Theme | Static "Light · On — a dark mode is designed and coming soon" placeholder; the dark CSS tokens existed in `globals.css` but nothing ever set `data-mode="dark"`, and `<body>` used a **fixed, non-token** `bg-offwhite` literal that would have stayed white even with the attribute set | Real Light/Dark `Switch`, client-only (`localStorage`, no schema change), wired through a new `ThemeProvider`/`useTheme()` (mirrors the existing `DeviceTierProvider` pattern). Fixed `<body>` to the token-based `bg-surface` so the flip actually reaches the page background — verified in-browser (computed `background-color` flips `#fefefe → #171b17`) | `overnight-7d` |

## 2. Explicitly NOT built — genuine product/schema decisions (per your instruction to stop and list, not guess)

| Item | Why it's a decision, not execution | What exists today |
|---|---|---|
| **Notifications** (dead bell → real panel) | Needs the **event set** decided first (which real events fire a notification: commission credited? KYC status change? withdrawal paid? certificate issued? milestone?) plus copy for each, read/unread semantics, and a schema (new table) — several of these events are money/KYC-adjacent, which compounds the schema question with a Tier-A one. | Bell icon in `components/nav/app-shell.tsx:306` renders, has no `onClick`, purely decorative. No schema. |
| **Admin dynamic banner** | The **banner data model** itself is undecided: image vs GIF vs video, single banner or a queue/schedule, admin-uploaded file (needs storage + size/type validation) vs URL-only, active date range or manual on/off. Building the schema/CRUD without this would be guessing at all of the above. | No banner slot exists on Home today; nothing to wire a click-through into yet either. |
| **Referral click/signup/conversion tracking** | **Attribution/dedup rules** are undecided: what counts as a unique "click" (cookie? IP+UA hash? time window?), how long a click stays attributable before a signup, how "conversion" is defined/computed and over what window. Note: signup-side attribution **already works** (DR-030 first-touch ref-cookie capture, `ref-cookie.test.ts`) — the gap is specifically pre-signup click logging and a conversion metric on top of it, both of which need the dedup-rule decision first. | Referral link/QR/share already fully built (`components/affiliate/share-block.tsx`); signup attribution already live. |

**Ask:** if you want any of these three built this cycle, the fastest path is you (or Fable) making the specific decision above in a sentence or two per row — I can implement same-session once that's set.

## 3. Item 7e (toggleable D-01/payouts in test) — already exists, no code change

`lib/env.ts` `payoutsEnabled()` already reads `AFFILIATE_PAYOUTS_ENABLED` from the environment —
this **is** the test-env-only switch the backlog asked for; it's just currently unset (`false`) in
this machine's `.env`. Setting `AFFILIATE_PAYOUTS_ENABLED="true"` in a **local/staging `.env`
only** (never committed — it's gitignored) makes the full withdrawal/payout UX render immediately
with sandbox keys, exactly as designed. I deliberately did **not** build a live admin-UI toggle for
this: `components/admin/payout-flag-ceremony.tsx` intentionally requires an env-var edit +
redeploy (a "ceremony") as the safety friction for a real money-movement gate (Golden Rules 2/9) —
adding a one-click live toggle would undermine that on purpose-built friction. Flagging the
reasoning rather than silently doing nothing.

## 4. Item 8 — pre-ship security checklist audit (read-only, no code changes needed)

Audited `Knowledge-Base/Standards/pre-ship-security-checklist.md` against this repo. Most items are
written for an **npm-package-publish** leak scenario and don't map 1:1 onto a web app, but checked
everything that does apply:

- ✅ Source maps: `productionBrowserSourceMaps` unset → Next.js default `false` (no client source maps shipped in production).
- ✅ `.gitignore`: thorough — `.env`/`.env.*`, `*.pem`/`*.key`/`*.p12`/`*.crt`, `secrets.*`, logs, local DBs, QA session tokens all excluded; `.env.example` has no real values.
- ✅ No hardcoded secrets: grepped for live/test key patterns (`sk_live`, `rzp_live`, `AIza*`, PEM private-key headers) across `app/components/lib/prisma/scripts` — zero matches.
- ✅ Error boundaries never log/render the raw error object — only `error.digest`/`.message` (see `app/error.tsx`, `app/global-error.tsx`), so no accidental env/stack leakage into logs.
- ✅ Lockfile: `package-lock.json` is committed and tracked.
- ⚠️ "Dependencies pinned to specific versions": all 30 direct deps use caret ranges (`^x.y.z`), not exact pins — **this is standard, safe npm practice** for an application (not a published package): `npm ci` installs the exact versions frozen in the committed lockfile regardless of the caret range, which is what actually matters for reproducibility. Converting to exact pins would fight the ecosystem norm for no real safety gain — noting it as reviewed-and-accepted, not a gap.
- N/A — CI-dependent items (secret scanner in CI, automated build-artifact-tarball check): **no CI pipeline exists in this environment** (confirmed earlier this session — no GitHub remote, no `gh`, no Actions to wire into). Flagging as a setup item for whenever CI is stood up, not something I can action now.
- ✅ Admin audit trail already exists (`AdminAction` rows, `admin-audit.integration.test.ts`) — privileged actions are logged and reviewable.

No fixes were needed — audit found the repo already compliant on every actionable item.

## 5. Everything flagged NEEDS TIER-A REVIEW

1. **`overnight-1`** — the login/session fix touches `middleware.ts`, `lib/auth/session.ts`, `lib/auth/admin.ts` (session-verification path). Per your note, this already had an early Tier-A read and **PASSED** — no hold, but re-stating it here since it's the one commit that touches auth logic (not just display).
2. **`overnight-3`** touches `components/ui/card.tsx`, a shared primitive consumed by every money-adjacent surface (wallet, KYC, checkout) — display-only (className strings only, no logic), but flagging because of its blast radius.
3. **`overnight-6`** touches `components/affiliate/kyc-form.tsx`, `components/affiliate/withdraw-form.tsx`, `app/checkout/checkout-form.tsx`, `components/dashboard/lesson-player.tsx` (signed-URL video player) — all confirmed className-only (diffs spot-checked in-session), but these are money/PII/signed-URL surfaces so flagging per your standing instruction.
4. **Dark mode (`overnight-7d`)** — no schema/DB/money touch, but flagging since it changes `<body>`'s background token app-wide (`bg-offwhite` → `bg-surface`); confirmed visually identical in light mode (`--gs-surface` = `#fefefe` = old `bg-offwhite` value) but calling it out since it's a root-layout change.
5. **If any of the §2 decisions get greenlit** (notifications, banner, referral tracking) — those will need schema migrations and are Tier-A by definition (new tables, money/KYC-adjacent events).

Nothing above was self-approved or merged — all parked per the standing gate.

## 6. Full commit list (branch `gps-overnight-rework`, oldest → newest)

```
bed0ecf overnight-1: fix false /login bounce on transient Supabase auth errors (Tier-A)
b5b5f5e overnight-2: back-navigation — orphan Earn pages in sidebar + back links (Tier B)
db0230a overnight-3: admin premium redesign — token migration + motion (Tier B, display-only)
32f095c overnight-4: public marketing token migration (Tier B, display-only)
a7af0ad overnight-5: non-vibrant dashboard stragglers onto the vibrant motion + card system (Tier B)
5add650 overnight-6: app-wide colour-token cleanup + grep lint-guard (Tier B, display-only)
a57d258 overnight-7d: dark mode — wire the Settings "coming soon" toggle to the existing dark tokens
```

Every commit: `npm run typecheck` clean, `npx eslint` clean on changed files (only 2 pre-existing,
unrelated warnings in `guru-panel.tsx` throughout), 488/488 Vitest tests green, `npm run build`
compiles successfully (the only build error at every step is the pre-existing, by-design
dev-providers-in-production guard — unrelated to any of this work, documented in project memory).

## 7. What's left from the original backlog

- **Item 7a/7b/7c** (notifications, dynamic banner, referral tracking) — blocked on the product decisions in §2.
- **CI wiring for `lint:tokens`** — no CI pipeline exists in this environment to wire it into; the script itself works today via `npm run lint:tokens`.
- Everything else in the ordered backlog (items 1–6, 7d, 7e, 8) is COMPLETE per the Module Execution Rules' two-end-states doctrine — no partial/half-built work was left in any commit.
