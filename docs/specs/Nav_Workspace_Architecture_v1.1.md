# GoSkilled — Navigation & Workspace Architecture (decision doc v1.0)

> **Status: DRAFT for founder approval.** UX-architecture review before Phase 3. No code/spec/roadmap changes until we both approve. Then: update IA v2.0 §1 + Dashboard v3.0 §1/§2 + roadmap (insert a nav-rework unit), and continue building. This is a **warranted architectural stop** — the nav model touches every workspace and Phase 2 built the wrong pattern; cheaper to fix now than to build Learn/Earn/Account on it.

## 1. The current implementation (what Phase 2 built)
The sidebar shows **all six workspace groups at once** (Home · Learn · Earn · Explore · Guru AI · Account) **plus** a contextual **sub-nav** for the active workspace (Dashboard · Network · Wallet …). 
**Problems (founder is right):**
- **Two navigation systems on one screen** — the workspace list *and* the in-workspace sub-nav both act as primary nav → cognitive overload.
- **Duplicated meaning** — "Earn" and "Affiliate Dashboard" point at the same place; the user sees both.
- **No focus** — nothing signals "you are now in the Learning app"; everything is always visible = it reads like a generic admin template, not a workspace-based product.

## 2. Founder's proposal (contextual workspace-switch)
Home = command center. Entering a workspace **replaces the whole sidebar** with only that workspace's pages; Home/other-workspace/Account nav **disappears**; "Back to Home" exits. Each workspace feels like its own app. Mobile = a 4-tab bottom bar (Home · Learn · Earn · Account) that switches the contextual interface.

## 3. Verdict — the proposal is right; one part needs refining
**Agreed (adopt):** the contextual model is clearly better than the current one. One workspace → one sidebar → one nav. The sidebar *is* the workspace's page list (this **removes the sub-nav / two-nav problem entirely**). Focus + OS-feel + no duplication. This is also what our *original* vision said ("each workspace feels like its own dedicated application") — Phase 2 drifted.

**Challenged (my refinement):** *pure* "full replacement + only Back-to-Home" over-corrects and adds friction where GoSkilled least wants it. GoSkilled's whole thesis is **Learn AND Earn** — users bounce between them. If entering Learning fully hides Earn, switching Learn↔Earn becomes a **2-step trip** (Back to Home → Enter Affiliate) every time. That taxes the exact behaviour we want to encourage (and referral virality). Also: your **mobile** model already keeps a persistent 4-tab switch — so pure-replacement would make **desktop and mobile inconsistent**.

**The winning pattern (Slack / Linear / Notion / macOS):** a **thin, persistent workspace switcher** + a **contextual sidebar**.
- A minimal **switcher rail** (Home · Learn · Earn · Account — icon+label, ~64px rail or a top segment) is *always* visible = **1-tap workspace switch**, and it *is* the "OS app-switcher" that makes it feel like an operating system (your stated goal). This is **not** the duplicate nav you're rejecting — the duplicate nav was the *full Earn sub-nav shown alongside everything else*. A 4-item switcher is the dock, not a second menu.
- The **main sidebar** shows **only the active workspace's pages** (no sub-nav tabs, no other workspaces) — exactly your focus requirement.
- **Desktop = mobile:** the mobile bottom-bar *is* this switcher; the mobile drawer *is* the contextual sidebar. One model, both screens.

Net: you keep everything you want (focus, one-sidebar-per-workspace, no duplication, OS feel) **and** switching stays 1-tap. Recommended.

## 4. Final architecture (proposed)
**Primary switcher (persistent):** **Home · Learn · Earn · Account.** Guru is **not** a top-level workspace — it's **floating on every workspace** + an item inside Learn/Earn (your own lists show this). **Explore is not a top-level** — browse/plans fold into **Learn ("Browse courses")** + a Home "Store" entry (matches your 4-tab mobile). Feature-Visibility (DR-040): when Earn is hidden, it drops from the switcher too → reviewer sees Home · Learn · Account only, no trace.

**Contextual sidebars (only the active workspace's pages):**
- **Home** (command center — the landing): welcome · dynamic banner · today's summary · notifications · **referral copy/share** · AI insight · quick actions · recent activity · colourful cards/graphs · **Enter Learning** · **Enter Affiliate**. (Home has no left-page-list — it *is* the hub; the switcher is the nav.)
- **Learning:** Dashboard · My Courses · Continue Learning · Assignments\* · Certificates · Webinars · Guru · Browse courses · ← Home.
- **Affiliate:** Dashboard · My Network *(L1/L2/L3 inside — "My Team" folded in; they're the same tree, per your anti-duplication rule)* · Leads · Wallet · Withdraw · Rewards · Leaderboard · Commission Structure · KYC · Guru · ← Home.
- **Account:** Profile · KYC *(single source; also linked from Affiliate)* · Security · Notifications · Settings · Support · Logout · ← Home.
Theme follows the active workspace (neutral Home · green Learn · gold Earn).
**Cross-cutting (actions, not nav):** the **referral/share** affordance stays available inside Learning too (it's GoSkilled's #1 growth lever — an action, not an Earn-nav item), so hiding Earn's nav never hides "share."

## 5. User flows
**Desktop:** Login → **Home** (switcher shows Home·Learn·Earn·Account, Home active). Click **Learn** (switcher) OR **Enter Learning** (Home card) → sidebar becomes Learning-only, theme green, content = Learn Dashboard. Click **Earn** in the switcher → 1-tap to Affiliate (gold). Click **Home** → back to command center. Account via switcher.
**Mobile:** Login → **Home**. Bottom bar = Home · Learn · Earn · Account (the switcher). Tap Learn → contextual Learning screen + a hamburger drawer = Learning pages. Tap Earn → Affiliate. Same model, thumb-reachable. Persistent **Share** stays reachable (FAB-adjacent or in-context, per Fable — no separate FAB clutter).

## 6. Implementation risks
1. **Phase 2 shell rework** — the merged AppShell built the all-workspaces + sub-nav model; it must become switcher + contextual sidebar. Real work, but contained to the shell (routes/pages unchanged). **Do it before Phase 3** so Learn/Earn/Account build on the right frame.
2. **Active-state + deep-links** — the switcher must derive the active workspace from the route prefix (`/dashboard/learn/*` → Learn); a deep-link into any page must open the right contextual sidebar.
3. **Feature-Visibility (DR-040)** — the switcher itself is a visibility surface (hidden Earn drops from the switcher + Home cards); fold into the Phase-7 acceptance.
4. **"Home" vs old `/dashboard`** — the old hub duplication (already flagged) gets cleaned up in this rework.
5. **Guru placement** — floating + per-workspace item, never a 5th switcher slot (keeps the switcher at 4).

## 7. Roadmap impact
Insert **Phase 2.5 — Navigation rework** (switcher + contextual sidebars + Home-as-hub, on the corrected model) **before Phase 3**. Phase 3 (Learn), 4 (Earn), 5 (Account) then build their contextual sidebars on it. Small net delay, large correctness gain. IA v2.0 §1 + Dashboard v3.0 §1/§2 get amended to this model.

## 8. Open decision for the founder
**A. Switcher variant (the one real choice):** (i) **thin persistent switcher + contextual sidebar** (my recommendation — focus + 1-tap switch + desktop=mobile), or (ii) **pure full-replacement + Back-to-Home only** (max focus, but 2-step Learn↔Earn switch + desktop≠mobile). 
**B. Confirm:** Explore folds into Learn/Home (not a top-level)? · "My Team" folds into "My Network"? · Guru floating + per-workspace (not a switcher slot)?

## v1.1 — LOCKED + external-review fixes (2026-07-10)
Founder: *"take the good changes, don't increase scope."* Two reviews (Claude Pro risk-focused · ChatGPT UX) folded — value only. **This is a shell REFACTOR (6→4 switcher · delete sub-nav · contextual sidebar), NOT a new phase.** Decision A = **(i) thin persistent switcher + contextual sidebar — SETTLED**, not open.
- **Switcher (4, persistent):** **Home · Learn · Earn · Account.** Explore folded → "Browse courses" in Learn + a **first-class "Store" card on Home** (add-on courses ≈ near-100% margin — don't bury the upsell).
- **Guru AI — REMOVED from V1 (founder decision → DR-041).** Off all nav/sidebars/in-context chips; existing tutor code stays **dormant behind a disabled flag** (re-addable later, no routing change). Replaced by **Support** in Account (Help/FAQ · Contact · WhatsApp · Tutorials/Onboarding · tickets later). Guru → Future backlog (own sprint). *(Also removes the Guru-on-Earn income-representation risk Claude Pro flagged.)*
- **Dedup (our own rule):** **KYC = Account only** (Affiliate Withdraw shows an inline "Complete KYC first → [Start KYC]" gate, not a duplicate nav item). **Wallet includes Withdraw** (one ledger). "My Team" → **My Network**. Notifications = **global top-bar bell**, not a per-sidebar item.
- **Sidebars (lean V1):** *Learn* = Dashboard (Continue-Learning INSIDE it) · My Courses · Certificates · Webinars · Browse courses · ← Home. *Earn* = Dashboard · My Network · Leads · Wallet · Commission Structure · ← Home (Rewards/Leaderboard secondary, not primary nav). *Account* = Profile · KYC · Security · Settings · Support · Logout · ← Home.
- **Mobile:** bottom bar Home·Learn·Earn·Account; workspace pages = **content sections + scroll** (drawer only for overflow — a hamburger is near-invisible to Tier-2/3). "desktop = mobile" = same *model*, not same chrome.
- **DR-040 reframe (compliance):** the affiliate flag = a **legal launch-gate / staged rollout** (Earn disabled until affiliate legal review clears), **NOT** reviewer "cloaking/no-trace." It gates the actually-regulated surfaces — **share/referral link · `/join/[code]` route · commission attribution** — first; nav-hide is secondary.
- **Switcher placement:** top bar → thin switcher (~64px left-rail *or* top-segment) → contextual sidebar → content; CC shows both options in the refactor.

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — nav/workspace architecture review before Phase 3: current-impl critique · founder proposal · verdict (contextual switch, refined with a thin persistent switcher) · final architecture · desktop+mobile flows · risks · roadmap impact (Phase 2.5). Draft for founder approval.
