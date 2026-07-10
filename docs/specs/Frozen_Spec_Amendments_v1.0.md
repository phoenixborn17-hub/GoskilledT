# GoSkilled — Frozen Spec Amendments v1.0 (BINDING)

> Founder-approved Fable final-review **P0/P1 (incl. 4 thin-adds)**, 2026-07-10. These **OVERRIDE** the referenced specs where they conflict/extend. Read alongside the specs + `GoSkilled_Implementation_Roadmap_v1.0`. All within locks (D-29/D-01/DR-034-040/perf gate/re-skin-in-place). Folded into roadmap phase-acceptance.

## A. Naming & navigation → align to IA v2.0 (authoritative)
Sidebar/labels per **IA v2.0 §1/§12.2**: **Explore** (not "Marketplace") · **Guru AI = its own workspace** (Guru Assistant + AI Insights) **and** floating on every surface · **Account split** (Profile/Verification-KYC/Settings/Security/Notifications/Support/Help/About/Logout). `Dashboard_Redesign_v3.0 §1` map is superseded by IA v2.0. Build the shell (Phase 2/U2) to IA v2.0.

## B. Money-never-fail-to-zero + Error state → Experience System §11/§12
Widget-registry template gains an **Error** column (+ stale/offline). **Rule:** a currency/earnings/referral-count value renders **only from real data; on failure show "Couldn't load — Retry", never ₹0, never blank.** Applies to wallet/earned/held/balances/referral-counts/commissions.

## C. Device-tier heuristic — single definition → Experience System §8
Low tier = `prefers-reduced-motion` OR `saveData` OR `deviceMemory ≤ 3` OR no `backdrop-filter` support → **glass/blur off · transforms off · Lottie→static · count-up off.** One shared util (`lib/device-tier`); every unit consumes it. Governs motion **and** glass/blur.

## D. Earn — eligibility fork + Withdraw truth → Dashboard §4 (Phase 4, Fable Tier-A)
- **Zero-state, two variants:** (A) *not-yet-eligible* (no own purchase, DR-038) → "Step 1: Get your package — earning unlocks with your purchase" → Explore Plans; (B) *eligible-no-referrals* → share flow. Never show "share to earn" to a non-eligible user.
- **Withdraw = truth surface (not a dead-end):** lead with honest ledger-backed status ("earnings recorded & safe; payouts open [status]") + notify-me toggle + Credits proof link; **request form renders only when the payout gate is open**; until then CTA honestly disabled with reason. Never a fake "Paid."
- **Register-2 calm:** Wallet/Withdraw/KYC = neutral-calm, **thin gold accents only**, charcoal tabular numbers. **No count-up on money** (learning stats only). Commission value = honest **range "₹150–₹250 per referral"** → Commission Structure. Held-balance 48h = buyer-protection trust framing. Proud no-guarantee line fixed in footer.

## E. Feature Visibility — leak channels → FeatureVisibility acceptance (Phase 7)
With Affiliate hidden, ALSO hidden/absent: **notification history** (commission/earning), **Activity Feed** earning events, **Account › Profile referral code**, and the **mobile bottom-bar recomposes Learning-only** (Home·Learn·Explore·Guru — no dead slots). **Open founder Q:** public marketing-site review-window earn-copy variant (reviewer sees Zone-A too)?

## F. Home performance → Dashboard §2 (Phase 2)
One **composed server-rendered summary payload** for the first viewport (greeting + Today's Summary + primary CTA); everything below **streams with per-section skeletons in priority order**. Merge cross-workspace snapshot INTO the Enter-Workspace cards; Quick Actions contextual (≤4, rules-driven).

## G. Trust & conversion (approved thin-adds + rules)
- **"Referred by [first name] ✓"** at registration when the code auto-fills (reads sponsor first name only) — IA §7 (Phase 5).
- **WhatsApp OG preview** surfaces: referral link · **certificate-image** · course — IA §5.2/§6 (Phase 6).
- **WebOTP** auto-read on register/login/checkout (SMS carries origin tag) — Phase 10.
- **Trust marks at the decision element** (Buy/Pay/KYC/Withdraw), never footer.
- **Guru:** no mobile FAB — top-bar entry every workspace + in-context chips; stream, never spinner (Phase 5).
- **KYC = "Get payout-ready"** 3-step + why + AES-256 signal (Account; Phase 5).
- **Chart ≥3 data points** rule; else stat + "graph appears after…" (Experience System §9).

## H. Micro-interactions → Experience System §8 (capable tier, degradable)
Workspace-switch theme crossfade (200ms) · **copy-link = the most-polished 300ms** (morph→"Copied ✓"→WhatsApp nudge) · **Certificate-Earned signature moment** (SVG draw→seal Lottie→confetti→Share; static fallback) — banks the R3F slot · single **top-left light-source** rule. **No launch R3F.**

## Change log
- v1.0 — 2026-07-10 (Opus) — approved Fable final-review P0/P1 (+4 thin-adds) as binding amendments over the frozen specs; feeds roadmap phase-acceptance. **Specs FROZEN.**
