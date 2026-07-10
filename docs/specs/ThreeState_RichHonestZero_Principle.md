# GoSkilled — Three-State Design + Rich-Honest-Zero (BINDING design law)

> Founder direction (2026-07-11). **Supersedes the earlier "zero-data = suppress cards + show only a getting-started" approach** (Fable P0-2 / Amendments §B). Extends `Experience_System_v1.0 §1`. Binding on all dashboards/cards/widgets + the widget registry.

## The correction (why)
**Premium experience ≠ fake data. Premium = Rich UI + Honest data — together.** A new user with no data must still see the **complete** dashboard — all cards, graphs, widgets, sections, structure, animations — with **honest zero values** and **motivating micro-states**. Never hide/reduce the UI just because data is absent. **D-29 forbids FAKE data, NOT a rich layout at honest zero.**
- Honest + visible: Wallet ₹0 · Referrals 0 · Progress 0% · Certificates 0 · Network 0 — every card present, beautiful, motivating.
- Each empty widget carries a motivating **unlock line**, e.g.: "Complete your first lesson to unlock Progress Analytics" · "Invite your first friend to build your network" · "Your wallet is ready to receive commissions" · "Complete Lesson 1 to unlock your first certificate" · "Your achievement journey starts here."
- The dashboard feels **alive and full of opportunity**, never empty/broken. Objective = excitement · motivation · discovery — NOT interface reduction.

## The three states — every card/widget/dashboard defines all three
1. **New user** → honest zero-state, but a **complete + exciting** UI with motivating unlock micro-copy.
2. **Active user** → real progress, recommendations, next-best-action, momentum.
3. **Power user** → rich analytics, achievements, insights, advanced tools.
Dashboard is never "empty vs filled" — it is intentionally designed for each stage. **The widget registry gains a New / Active / Power column; every card spec must state its behavior in all three.**

## Product philosophy — every page answers
What's happening? · What should I do next? · What can I unlock? · What have I achieved? · What opportunities are available? — the dashboard **guides**, it doesn't just display.

## Impact (rework, not rebuild)
Home/Learn/Earn currently SUPPRESS the stat cards + analytics at zero and show a 3-step getting-started. **Rework:** render the full rich dashboard at honest-zero with per-widget unlock micro-states; keep a getting-started strip as ONE motivating element, not the whole screen. Honest-zero everywhere (D-29 intact); money still `safeMoney` (real ₹0 is honest, a failed-load still shows "Couldn't load").

## Change log
- v1.0 — 2026-07-11 (Opus, steward) — founder-directed correction: rich-UI + honest-zero + motivating micro-states; three-state (New/Active/Power) design law; supersedes zero-data card-suppression.
