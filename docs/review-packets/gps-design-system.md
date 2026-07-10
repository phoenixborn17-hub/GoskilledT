# Review Packet — Phase 1: Design System foundation (Redesign U0–U1)

- **Branch:** `gps-design-system` (off `main` @ `61fe0d2`)
- **Commits:** `9b43288` (governance specs) · `81afbfc` (design system build)
- **Tier:** **B — Opus + founder visual pass** (per Roadmap Phase 1 review gate). Not money/PII/compliance → no Fable Tier-A.
- **GATE:** **PARKED — not merged. `main` untouched.** Awaiting Opus Tier-B review + founder visual pass, then explicit human merge authorization.
- **Spec basis:** `GoSkilled_Implementation_Roadmap_v1.0` Phase 1 · `Frozen_Spec_Amendments_v1.0` §A–§H · `GoSkilled_Experience_System_v1.0` §2–§13 · `Dashboard_Redesign_v3.0` U0–U1 · `DESIGN_DIRECTION` (constitution).

---

## 1. What was built

The single token + component **source of truth** for the whole redesign, plus the two utilities that carry the trust locks.

**Tokens (`app/globals.css` + `tailwind.config.ts`)**

- Full **green / gold / neutral ramps 50→900** (Experience System §2), semantic colours, and a workspace-adaptive **`theme` token** (`bg-theme` = green in Learn, gold in Earn, charcoal in Admin) driven by `[data-theme]`.
- Dark-ready **semantic surface tokens** (`surface`/`ink`/`line`) + **dark palette defined but dormant** (`:root[data-mode="dark"]`, never set at launch → flip a flag, no rework).
- **Sora/Inter type scale** (`text-display`…`text-caption`), spacing/radius/elevation, and **motion tokens** (`duration-base`, `ease-standard`).
- **Device-tier CSS hooks** (`:root[data-device-tier="low"]`) that flatten glass/blur + transform motion from one source.

**Utilities**

- `lib/format.ts` — Indian digit grouping + **money-never-fail-to-zero** (`safeMoney`/`safeCount` → `{ok:false}` on missing/non-finite data; §B).
- `lib/device-tier.ts` + `components/system/device-tier-provider.tsx` — the **single device-tier heuristic** (reduced-motion OR saveData OR deviceMemory≤3 OR no backdrop-filter; §C), governs motion AND glass.

**Component library (~67 modules; ≥55 target met)** on the existing shadcn-style base — every one token-only, all states, a11y (role/label/keyboard), mobile+desktop:

- **Primitives/feedback (ui):** IconButton, Textarea, Select, Checkbox, Radio, Switch, Chip, Avatar, Divider, Tooltip, Tabs, Stepper, Breadcrumb, Pagination, Modal, Drawer, ConfirmDialog, Popover, Toast, OfflineBanner, ComingSoon, MaintenanceScreen (+ existing Button/Input/Badge/Skeleton/Alert/EmptyState/ErrorState/LoadingState/SuccessState/FormField/Label/OtpInput/Confetti).
- **Navigation (nav):** Sidebar, SidebarItem, WorkspaceSwitcher, Topbar, BottomNav.
- **Data display (data):** DataValue, WidgetContainer, ProgressRing, ProgressBar, StatValue, Sparkline, KpiTile, Timeline, DataTable.
- **Card families (cards):** StatCard, WalletCard, ChartCard, ShareWidget, QRCode, GettingStartedCard, HeroBanner, AnnouncementBanner, QuickActionCard, NotificationCard, CourseCard, CertificateCard, RewardCard, LeaderboardCard, AISuggestionCard, ProfileCard.

**The two trust locks, baked in structurally (not per-surface convention):**

- **money-never-fail-to-zero** → the `DataValue` atom is the single render path for every currency/count; on failure it shows **"Couldn't load — Retry", never ₹0/blank**. StatCard/WalletCard/DataTable route money through it.
- **Error state in every data component** → `WidgetContainer` + DataTable + ChartCard + StatCard carry loading/empty/**error+retry** by construction; ChartCard/Sparkline enforce the **≥3-data-point** rule (honest empty, never a fake curve).

**Showcase:** `app/design-system` — a living style-tile → real-components gallery for the founder visual pass (noindex; includes a live money-fail demo and green↔gold theme-switch panel).

---

## 2. Completion criteria (Roadmap Phase 1) — status

| Criterion                           | Status               | Evidence                                                                                                    |
| ----------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Every component renders from tokens | ✅                   | No hard-coded colours; `bg-theme`/`text-ink`/`border-line` throughout                                       |
| green ↔ gold theme switch works     | ✅                   | Live: `bg-theme` = `rgb(19,126,73)` under `data-theme="learn"`, `rgb(237,200,37)` under `data-theme="earn"` |
| dark dormant defined                | ✅                   | Full dark palette under `:root[data-mode="dark"]`, never applied at launch                                  |
| existing pages unbroken             | ✅                   | `/dashboard` renders real content ("Namaste, Ashish") post-change; 364 unit tests green                     |
| device-tier single def              | ✅                   | `lib/device-tier.ts`; live `data-device-tier="full"` stamped on `<html>`                                    |
| money-never-fail + Error baked in   | ✅                   | `DataValue`/`WidgetContainer`; 17 render tests; visible in showcase                                         |
| retire/consolidate `--gs-*`         | ✅ (see §5 decision) | Single `--gs-*` source expanded; no dual scheme                                                             |
| tsc / lint / prettier / suite green | ✅                   | Below                                                                                                       |

---

## 3. Verification

```
npx tsc --noEmit                → exit 0 (clean)
npx prettier --check <changed>  → All matched files use Prettier code style!
npx eslint <changed>            → 0 errors, 0 warnings on new files
                                  (2 pre-existing warnings remain in guru-panel.tsx, on main)
npx vitest run tests/design-system.test.tsx        → 17 passed
npx vitest run --exclude **/*.integration.test.ts  → 48 files, 364 passed
```

**Browser (next-dev, `/design-system`):** compiled clean, **no console errors**; money-fail-safe visible (Available → "Couldn't load · Retry" beside "Total earned ₹15,750"); gold-contrast rule holds (Mentor badge = charcoal-on-gold; financial numbers stay charcoal). Screenshot captured in session.

**Integration/money suites not re-run:** they write un-cleanable rows to the shared **live** Supabase (documented env constraint). This change is presentation-only with **zero money-logic surface** — no ledger/webhook/commission code touched — so money non-regression is structurally guaranteed. Steward can run them in a DB-safe environment if desired.

---

## 4. Component coverage vs Experience System §10 (~55)

**Delivered: ~67 modules.** Intentionally **parked** (Phase 2–4 compositions or reserve — never faked): Combobox, Slider, standalone Tag/Link wrappers, Calendar, ReferralTree (Phase 4), Carousel, Accordion, VideoPlayer (Phase 3 player is leak-tested — untouched), FileUpload, SearchBox, **CommandPalette (spec = RESERVE, not on the consumer path)**. `TransactionTable`/`LeaderboardTable`/`AnalyticsCard` are covered by `DataTable`/`ChartCard` composition.

---

## 5. Decisions & rationale (please confirm)

1. **`--gs-*` "retirement" interpretation (needs steward nod).** The spec says both "retire `--gs-*`" and "legacy `--gs-*` must _become_ the single source … no dual token systems" (A3/DR-039 P0-5), while "existing pages unbroken" is a hard completion criterion. I read this as **consolidate to ONE `--gs-*` source and introduce no parallel scheme** — NOT rename the prefix (which would force-touch ~60 merged files and risk regression, violating re-skin-in-place). All new tokens live under `--gs-*`; downstream is token-only. If you intended a hard prefix rename, flag it and I'll schedule it as its own migration unit.
2. **`brand` stays fixed-green; new `theme` token is workspace-adaptive.** Existing components use `bg-brand` (green) and must not flip to gold inside the Earn layout — so `brand` is untouched and workspace-adaptive theming is the _new_ `theme` token. Earn CTAs use the explicit `gold` Button variant (charcoal-on-gold, AA).
3. **Opacity-on-var tokens** (`bg-theme/10`, `bg-info/10`) follow the **existing shipped `alert.tsx` convention** — verified rendering correctly in-browser.
4. **QR generation parked (honest, not faked).** `QRCode` draws a real scannable SVG from a module matrix; the URL→matrix encoder is a dependency-free Phase-2 item (no third-party image service → no referral-code leak, offline-safe). Absent a matrix it shows an honest "QR ready" affordance, never a fake code. ShareWidget's copy + WhatsApp work fully now.
5. **Providers not mounted in the root layout.** `DeviceTierProvider`/`ToastProvider` are built + demonstrated on the showcase; global mounting is a U2 (app-shell) change to keep Phase 1 off the shared layout.

---

## 6. Parked / follow-ups (tracked, none faked)

- QR matrix encoder (Phase 2 dependency).
- Provider mounting in app shell (U2).
- Combobox/Slider/Calendar/ReferralTree/Carousel/Accordion/FileUpload/SearchBox (Phase 2–4, on demand).
- Integration/money suites: run in a DB-safe env for a belt-and-braces green.

---

## 7. Self-assessment (5 lines)

1. **Faithful to the frozen specs** — every token/rule traces to Experience System / Amendments / Dashboard v3.0; the two trust locks (§B money-fail, §C device-tier) are enforced structurally, not by convention.
2. **Zero regression risk to money/existing surfaces** — additive only; `--gs-*` preserved; `/dashboard` + 364 tests confirm the merged app is intact.
3. **Honest by construction (D-29)** — no fabricated data anywhere; ComingSoon/empty/error states are the only representation of absent data; QR parked rather than faked.
4. **World-class bar** — token-only, full a11y, reduced-motion + device-tier gated, gold-contrast rule held; verified live in-browser with no console errors.
5. **Biggest judgment call = the `--gs-*` interpretation (§5.1)** — flagged for steward confirmation; everything else is low-risk and reversible (parked, `main` untouched).

**Review asks:** (a) confirm the `--gs-*` consolidation reading; (b) founder visual pass on `/design-system` (green↔gold, money-fail-safe, card families); (c) approve component coverage + parked list before U2.
