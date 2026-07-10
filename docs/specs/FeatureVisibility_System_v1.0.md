# Feature Visibility System (Affiliate Visibility Control) — Build Spec v1.0 (FROZEN)

> **BINDING: `Frozen_Spec_Amendments_v1.0 §E` adds leak-channel acceptance (notifications · activity feed · profile referral code · mobile bottom-bar Learning-only recomposition · marketing-site review variant).**

> **In-repo, self-contained spec (DR-027) → DR-040.** A founder-mandated, compliance-critical capability: **cleanly enable/disable any feature, module, or workspace** — per user, per role, or globally — so external reviewers (Razorpay, Google AdSense, government/auditors, compliance, demo accounts) can experience a **complete, polished Learning platform with no visible trace** that the Affiliate layer exists.
>
> **This is NOT presentation-only and NOT part of the dashboard re-skin** — it is a real feature-flag/visibility SYSTEM (config + server-side enforcement + graceful UI adaptation). Separate branch, separate review.
>
> **Tier:** **A-leaning (compliance + it governs visibility of the money/referral surface).** Recommend a **Fable Tier-A review** of the enforcement layer before merge — a leak (an affiliate route/API/widget reachable while "hidden") defeats the entire purpose during a Razorpay/AdSense audit.
> **Branch:** `gps-feature-visibility` off `main` (after the dashboard redesign, or parallel on its own tree). GATE — park-don't-merge.

## Why (strategic)
GoSkilled is a referral product that must pass payment-processor and ad-platform review, where visible MLM/affiliate mechanics are a rejection risk. A reviewer/auditor/demo account must see a clean, intentional **Learning** product — not a disabled-looking one. This is risk management for launch and for D-01 optics; it likely gates go-live with Razorpay/AdSense.

## Non-negotiables
1. **Server-side enforcement first.** Hiding must happen at the **data/route/API layer**, not just CSS/menu hiding. A hidden feature's pages, server actions, and API responses must be **unreachable** (404/redirect/empty) for a user in a "hidden" scope — not merely visually removed. Client hiding is cosmetic polish *on top of*, never *instead of*.
2. **Graceful, complete experience.** When the Affiliate layer is hidden, the app must feel **intentional and whole** — no empty slots, dead nav items, broken links, or "this feature is disabled" notices. The Home hub, sidebar, and dashboards **recompose** to a polished Learning-only product. A reviewer must get **no signal** that anything was turned off.
3. **No money-logic change.** This system changes **visibility/eligibility of surfaces**, never wallet/commission/withdraw math. Payouts stay OFF (D-01) independent of this. Hiding the Affiliate layer must never corrupt underlying ledger/state (data persists, just not shown/accessible).
4. **Fail-safe default.** If a flag is missing/ambiguous, default to the **more-hidden** state for affiliate surfaces (safer for a review) — explicit config to reveal.

## Scope of control
Toggle, independently: entire **Affiliate workspace**; each affiliate nav item; referral links/QR/share; wallet; withdraw; commissions; leaderboard; rewards (affiliate); every affiliate-specific widget on Home/Learn (e.g. the referral section, earn stat cards, earn quick-actions).

## Configurability (3 scopes, precedence global > role > user … or the safest resolution)
- **Global** — one switch hides the Affiliate layer platform-wide (fastest for a live review window).
- **Per role** — e.g. a `reviewer`/`demo` role sees Learning-only.
- **Per user** — flag specific accounts (the account you hand a reviewer).
Define a clear, documented precedence + resolution (recommend: if ANY applicable scope says hide → hide; fail-safe).

## Architecture (build as a general system, not an affiliate hack)
- A **feature-registry** (`features` table / config): key, description, default-visibility, scope-overrides. Extensible — **any future module/workspace** (Affiliate, AI, Marketplace, Communities, Jobs, …) can register and be toggled the same way.
- A single **`isFeatureVisible(featureKey, userContext)`** resolver used by: route guards/middleware, server actions/API handlers (enforcement), nav builder, and component render guards (polish).
- **Admin UI** to view/set flags at global/role/user scope with an audit log of changes.
- **Recompose logic** so layouts fill gracefully (sidebar groups, Home hub cards, dashboard sections) when a feature is hidden.

## Acceptance
- With Affiliate hidden (each scope): **no** affiliate route/API/action is reachable (direct-URL, deep-link, and API tests return 404/redirect/empty); **no** affiliate nav/widget/text renders anywhere (Home, sidebar, Learn); layouts recompose with no gaps/dead links; a fresh reviewer session shows a coherent Learning-only product.
- Underlying data intact (unhide restores exact prior state).
- Zero money-logic/behaviour change (money non-regression suites green).
- Audit log records every flag change (who/when/scope).
- Extensibility proven: a second dummy feature key toggles through the same system.
- **Fable Tier-A pass on the enforcement layer** (leak-hunt) before merge.

## Out of scope
Changing money math or the D-01 payout gate · new affiliate features · anything in the dashboard redesign spec.

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — Affiliate Visibility Control as a general Feature Visibility System; server-side-enforced, graceful recomposition, 3-scope config, extensible registry, admin UI + audit; Fable Tier-A on enforcement; DR-040.
