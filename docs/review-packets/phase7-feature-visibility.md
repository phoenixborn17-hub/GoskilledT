# Review Packet — Phase 7: Feature Visibility System (DR-040)

**Branch:** `gps-feature-visibility` (cut from `main @ d8c2bfd`)
**Tier:** **A — compliance-critical (Fable leak-hunt on the enforcement layer, then steward + founder).**
**Status:** BUILT · PARKED · **NOT MERGED** (GATE). Diff: `phase7-feature-visibility.diff` (26 files, +1373 / −136).
**Spec:** `docs/specs/FeatureVisibility_System_v1.0.md` (+ `Frozen_Spec_Amendments §E`, `Nav_Workspace_Architecture v1.1`).

---

## What was built

A **general, extensible feature-flag / visibility system** (not an affiliate one-off). The Affiliate
(`earn`) layer is the first consumer; a reserved dummy `marketplace` feature proves any future module
plugs in the same way.

**Architecture (5 pieces):**
1. **Registry** (`lib/feature-visibility/registry.ts`) — code source of truth for which features exist
   + defaults + fail-safe + admin-controllable. Extensible: add a key, it's toggleable everywhere.
2. **Pure resolver** (`resolver.ts`) — `resolveFeature(key, overrides, ctx)` precedence: **hide-wins /
   fail-safe** (any applicable global/role/user "hide" → hidden; else any "show" → visible; else
   default). `share` derives from `earn`. Node-testable, no DB.
3. **Server context** (`context.ts`) — loads user {id, role} + all overrides once per request (React
   `cache`), `getVisibleFeatures()` / `isFeatureVisible(key)` / `assertFeatureVisible(key)` (→ 404).
   **Fails SAFE**: a DB read error hides every `failSafeHidden` feature (never fails open).
4. **DB** — `FeatureOverride` table (featureKey · scope GLOBAL|ROLE|USER · scopeValue · visible ·
   updatedBy) + `REVIEWER` added to `Role`. Migration ships **RLS ENABLED deny-all** (golden rule 15).
5. **Admin UI + audit** (`/admin/feature-visibility`) — set/clear at each scope; every change writes an
   immutable `AdminAction` row atomically (reuses `recordAdminAction`).

**Enforcement (server-first, not CSS):**
- **Route subtree:** `app/dashboard/earn/layout.tsx` calls `assertFeatureVisible("earn")` → the WHOLE
  `/dashboard/earn/*` subtree (dashboard · network · wallet · commissions · leaderboard · rewards ·
  leads · commission-structure · KYC) is `notFound()` when hidden.
- **Server actions:** every affiliate action re-asserts (`earn/actions.ts` ×5, `my-leads/actions.ts`) —
  a direct POST can't skip a layout.
- **Route handlers:** `network/export/route.ts` + `kyc/doc/[kind]/route.ts` return 404 when hidden.

**Nav recomposition (presentation, from the server-resolved map):**
- `visibleWorkspaces(isVisible)` drops the Earn switcher item AND the Account→KYC sidebar item (no
  dead link to the guarded route). Shell hides the Share affordance (rail · topbar · drawer).
- Dashboard layout resolves visibility server-side and **omits `referralCode`/`shareUrl` from the
  client payload entirely** when hidden (no referral code in page source for a reviewer).

**Leak channels (§E) closed:**
- **Profile referral-code card** — hidden (`app/dashboard/profile/page.tsx`).
- **Home** — Share section, "Refer a friend" quick action, wallet card, zero-data share step — all gated.
- **Learn** — "Refer a friend" quick action + zero-data share step — gated.
- **Enter-Workspaces** — Affiliate card already gated (now via the real resolver).
- **Mobile bottom-bar** — recomposes to Home·Learn·Account (it IS the switcher; one code path).
- **`/register?ref` attribution display** — the visible "Invited by [name] ✓" is suppressed when `earn`
  is GLOBALLY hidden (anonymous context → global only).
- **Notifications / Activity feed** — there is **no in-app Notification model and no commission/earning
  notification exists today**; the earning "activity" charts live under `/dashboard/earn/*` (covered by
  the route guard). So there is no separate surface to hide now — flagged for when notifications land.

## Deliberate scope boundaries (challenge-with-logic)

- **No money-logic change.** Only surface visibility/reachability. Wallet/commission/withdraw math,
  DR-038 masking, and the D-01 payout gate are byte-identical. **Attribution writing (`referredById`)
  is UNCHANGED** — it's a money-neutral data link and removing it would be un-restorable, violating
  "unhide restores exact prior state." We gate the *visible* referral surfaces + the routes, keep the data.
- **`earn` default = VISIBLE.** Preserves current product behaviour (Earn is live) so nothing silently
  turns off. The GLOBAL hide is the review-window / pre-legal lever. **OPEN founder/LAUNCH_CONFIG
  question:** should the global default flip to HIDDEN until D-01 affiliate legal clears? (The system
  supports both; only the default value differs.)
- **DR-036 registration logic untouched** — invite-only code requirement is auth's job, not this
  feature's. Only the visible "invited by" framing is gated. **Open Q:** relax invite-only when
  affiliate is globally hidden? (founder / DR-036.)
- **Marketing site (Zone A)** earn-copy review variant = **explicit §E open founder question — NOT
  built.** (The 404 for a hidden earn route currently renders the marketing chrome, which still has an
  "Earn" marketing link — that's Zone A, the open question.)

## Tests / verification

- **Pure resolver** `tests/feature-visibility.test.ts` (8) — defaults · global/role/user scope ·
  **hide-wins across scopes** · reveal-over-default · `share`-follows-`earn` · cross-key isolation ·
  unknown-key. Green.
- **Adapter integration** `tests/feature-visibility-admin.integration.test.ts` (3) — set USER hide →
  listed + **audit row** + resolver hides that user (not others); clear → reverted + audit row +
  resolver back to default; rejects unknown / non-controllable keys. Green (live DB).
- **Full suite 458/458 green** (was 447; +11). **Money non-regression green** (earning-gate-webhook,
  quiz-cert-gate, money-flow). `tsc` clean · `eslint` clean · `prettier` clean.
- **Visual proof** (Playwright, real QA sessions; screenshots in the morning packet): reviewer Home
  (desktop + mobile) recomposed to Home·Learn·Account with no Share/referral/Affiliate; `/dashboard/earn`
  + `/dashboard/earn/wallet` → 404; Profile with no referral-code card + KYC dropped from the Account
  sidebar; admin flag UI showing Affiliate HIDDEN + Marketplace (2nd feature) toggle; and the restored
  (visible) state for contrast.

---

## ⚠ FABLE TIER-A LEAK-HUNT CHECKLIST (please verify before merge)

Enforcement (a single reachable affiliate surface defeats the purpose during a Razorpay/AdSense review):

- [ ] **Route subtree:** with `earn` hidden, direct-URL to EACH `/dashboard/earn/*` page 404s (layout
      guard). Confirm no earn page defines its own layout that bypasses `earn/layout.tsx`.
- [ ] **Server actions:** every mutating affiliate action re-asserts `assertFeatureVisible("earn")` —
      `recordReferralShare`, `sendKycVerification`, `confirmKycVerification`, `submitKyc`,
      `requestWithdrawal`, `addAffiliateLead`. A direct RPC with `earn` hidden must not mutate.
- [ ] **Route handlers:** `network/export` (CSV of real phone numbers) + `kyc/doc/[kind]` (signed doc
      URL) both 404 when hidden.
- [ ] **Fail-safe:** confirm a DB read failure in `context.ts` hides `earn` (fails safe, not open); and
      that `failSafeHidden` is set for `earn`/`marketplace`/`share`.
- [ ] **Precedence:** hide-wins is correct — a per-user `visible:true` cannot re-reveal past a GLOBAL
      `false`. Confirm this is the intended compliance posture (it is, per spec §Configurability).
- [ ] **Client payload:** with `earn` hidden, the referral code / share URL are NOT in the dashboard
      HTML/client props (grep the reviewer page source for the code).
- [ ] **Leak channels (§E):** no affiliate nav/widget/text/share/referral-code renders anywhere for a
      hidden user — Home, Learn, Profile, shell (rail/topbar/drawer), mobile bottom-bar.
- [ ] **Money non-regression:** confirm nothing under `lib/wallet`, `modules/`, the webhook, DR-038
      masking, or the withdraw gate changed (visibility only); payouts stay OFF (D-01) independently.
- [ ] **Audit immutability:** flag changes write `AdminAction` rows; note `AdminAction` has no DB
      UPDATE/DELETE trigger (immutable by convention only, like today) — flag if a trigger is wanted.
- [ ] **Extensibility:** the dummy `marketplace` key toggles through the same system (no earn-specific
      hack in the resolver except the documented `share`→`earn` derivation).

## 5-line self-assessment

1. **Enforcement:** server-first — route-subtree guard + per-action + per-route + fail-safe; nav/CSS
   hiding is polish on top, never the only gate.
2. **Money safety:** zero money-logic touched; attribution data preserved (unhide restores state);
   payouts OFF independent; 458/458 incl. money non-regression.
3. **Compliance framing:** built + documented as a legal launch-gate / staged rollout, never as
   hiding a live feature from a regulator (DR-040 reframe honoured).
4. **Generality:** a real registry + resolver + admin UI; proven extensible via a 2nd feature.
5. **Risk / open items:** global-default flip (LAUNCH_CONFIG), invite-only-when-hidden (DR-036), and
   marketing Zone-A copy variant are surfaced as founder questions, not silently decided.

## STOP — no merge

Fable Tier-A leak-hunt → steward verify → founder pastes authorization → merge. Per GATE, parked here.
