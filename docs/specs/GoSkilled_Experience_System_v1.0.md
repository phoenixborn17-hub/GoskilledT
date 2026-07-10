# GoSkilled — Experience System v1.0

> **The single source of truth** for how GoSkilled looks, moves, behaves, and feels — for every designer and developer. Grows the Design-System foundation (style tile v0.1) into a complete **Experience System**. Built on the **real brand tokens** (`globals.css`) + the **frozen Design Constitution** (`docs/DESIGN_DIRECTION.md`) — nothing invented. Consumed by build **Unit 1** as the token + component source of truth.
>
> Governance-consistent: DR-012 (Sora+Inter), DR-039 ("deep not dense" · sidebar · perf gate · device-tier motion), D-29 (honest states), WCAG AA. Companion visual: `Design_System_StyleTile_v0.1.html`.
>
> **Status: FROZEN v1.0 — founder-approved 2026-07-10 (foundation 9.2/10, expanded to full Experience System).** **BINDING: `Frozen_Spec_Amendments_v1.0` (Fable P0/P1) adds — §B Error-state/money-never-₹0 · §C single device-tier heuristic · §9 chart≥3-points · §8 micro-interactions.** Consumed by build Unit 1.

## §1. Experience principles (design laws)
**Brand personality** — GoSkilled feels: **Friendly · Confident · Motivating · Professional · Modern · Energetic · Proudly-Indian · Accessible.** Warm and trustworthy (money product in a scam-wary market), aspirational-yet-attainable. Every decision reinforces this. Voice: *"this is legit, this is for me, I can do this."*

**Design laws (every screen obeys):**
1. **One primary action per screen** — the north-star action is unmistakable.
2. **Every screen answers three questions:** *Where am I? · What should I do? · What's next?*
3. **Never a dead end** — every state offers a next step (esp. empty/error).
4. **≤2 clicks** for common actions (resume, share, withdraw, ask Guru).
5. **Deep, not dense** — clean action-first first paint; depth via progressive disclosure (DR-039).
6. **Honest by default (D-29)** — real data or an honest state; never fabricated numbers/charts.
7. **AI suggests the next best action** — Guru is proactive, everywhere, honest.
8. **Fast is a feature** — perf gate <2s first paint on budget-Android; motion device-tiered.
9. **Functional colour** — green=done/paid, amber=pending, red=failed; always icon+label, never colour-only.
10. **Gold is accent, never body text on light** (Constitution §14).

**UX principles:** mobile-first (design 320–375px up) · thumb-reachable primary actions · Hinglish + icon+word · progressive disclosure · optimistic UI · forgiving (undo over confirm where safe) · consistent placement (a control lives in the same place everywhere).

## §2. Colour & theme
**Brand core (locked):** Green `#137E49` (Learn) · deep `#0C5A34` · bright `#1AA05E` · Gold `#EDC825` (Earn, **accent-only**; gold-context text = amber `#B87A00`) · Charcoal `#2A302A` (Admin/neutral-900) · Off-white `#FEFEFE`.
**Ramps (50→900)** — Green, Gold, Neutral (green-tinted) per style tile v0.1. **Semantic:** success `#137E49` · warning `#B87A00` (text-safe) / strong `#8A5A00` · danger `#C0392B` · info `#1D6FA5`.
**Theme system:** **Light = launch default.** `[data-theme="learn"]` → brand=green · `[data-theme="earn"]` → brand=gold · Admin → charcoal. **Dark tokens defined now, dormant** (fast-follow): dark surfaces `#171B17`/`#1F251F`, text `#EDF0ED`, green-bright/gold tuned for contrast; every token has a dark value so enabling dark = flip a flag, no rework. **Contrast:** all text ≥ WCAG AA (4.5:1 body / 3:1 large); gold never used where AA fails.
**Gradients (device-tiered, subtle):** green 500→600 diagonal (Learn hero/accent) · gold 400→700 (Earn accent/icon only) · used as depth, never decoration; off on reduced-tier.

## §3. Typography
**Families:** **Sora** (display/headings) · **Inter** (body/UI/numbers, tabular for money) · **Noto Sans Devanagari** (Hindi). 
**Scale (rem / px @16):** Display 2.5/40 · H1 2/32 · H2 1.75/28 · H3 1.25/20 · H4 1.125/18 · Body 1/16 · Small 0.875/14 · Caption 0.75/12. Line-height 1.1–1.2 headings, 1.5 body (Hinglish-tested). Weights: Sora 600/700/800 · Inter 400/500/600/700. **Numbers:** Inter tabular-nums for money/stats. Max line length ~65ch.

## §4. Spacing · Radius · Elevation
**Spacing (8-pt):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. **Radius:** sm 8 · base 12 · lg 16 · full (pills/avatars). **Elevation (soft, charcoal-tinted):** sm `0 1px 2px /.06` (cards) · base `0 2px 8px /.08` (raised) · lg `0 8px 28px /.12` (popover/modal). Glass (refined, intentional — nav/floating/modals only): `rgba(255,255,255,.65)` + blur 10px + 1px light border; off on reduced-tier.

## §5. Grid & layout system
**Breakpoints:** mobile ≤640 · tablet 641–1024 · desktop ≥1025. **Grid:** desktop 12-col / tablet 8-col / mobile 4-col; gutter 24 (desktop) / 16 (mobile); max content container **1200–1280px**. **App chrome:** left **sidebar 264px** (collapsed 72px) · **header 64px** · content padding 24 (desktop) / 16 (mobile). **Mobile:** sidebar→drawer + bottom bar 56px; sticky top bar + sticky primary CTA where relevant. **Card widths:** stat cards min 200px (auto-fit grid); analytics cards span 6–12 cols; timeline/side widgets 4 cols. **Dashboard composition:** row1 hero/greeting (full) · row2 ≤4 stat cards · then analytics (tab/scroll) · then widgets — progressive disclosure (DR-039).

## §6. Iconography
**Set: Lucide** (`lucide-react`, already in stack) — consistent, outline, modern. **Size:** 16 (dense) · 20 (default) · 24 (nav/emphasis). **Stroke:** 1.75–2px. **Style:** outline default; filled/duotone for active/selected/emphasis only. **Colour:** `currentColor` (inherits text/brand); status icons use semantic colours + always paired with a label. One icon set only — no mixing. Money/affiliate icons stay neutral (no cash-spray clichés — trust).

## §7. Illustration
**Direction (Constitution §3/§5):** warm, **original, proudly-Indian, aspirational**; **flat / minimal 2D** (not heavy 3D — fails budget-Android); **Lottie** for lightweight celebration/success moments (device-tiered, static fallback). Use for: empty states, onboarding, getting-started, milestones, error/offline. Consistent character/colour system tied to green/gold. No stock 3D, no clip-art. Every illustration earns its place (delight/clarify/brand).

## §8. Motion & interaction system
**Tokens:** duration fast 150 · base 200 · slow 300 · celebratory 500ms. Easing: standard `cubic-bezier(.2,0,0,1)` (enter/exit) · emphasized spring for delight. **Device-tiered:** full on capable; on low-end + `prefers-reduced-motion` → opacity/instant, no transform-heavy motion. Motion **clarifies/guides/rewards** — never blocks content, never decorative.
| Interaction | Motion |
|---|---|
| Hover (button/card) | 150ms bg/shadow lift; card translateY -2px (capable only) |
| Page / route | View Transitions API, 200ms cross-fade/slide |
| Sidebar collapse | 200ms width + fade labels |
| Modal / Drawer | 200ms scale-in+fade / slide-in; backdrop fade |
| Toast | slide+fade in 200ms, auto-dismiss, exit 150ms |
| Chart | animate-in 300ms on first paint only (not on every re-render) |
| Loading | branded skeleton shimmer (not spinners) |
| Progress completion | ring/bar fill 300ms + subtle pulse |
| Reward / milestone | 500ms celebratory (Lottie/confetti) — capable only, static fallback |
| Success (enroll/first-lesson) | check-draw + soft scale, 300ms |
| Error | 150ms shake (2px) + colour, reduced-tier = colour only |

## §9. Charts & data-viz
**Library:** inline-SVG **sparklines** on critical routes (no lib) · **Chart.js** (in stack) lazy-loaded for heavy analytics (behind the Activity tab). **Allowed:** line · area · bar · stacked-bar · donut/ring · progress · sparkline · heatmap-lite (streaks). **Forbidden:** 3D · exploding/pie>3-slice · dual-axis · heavy gradients · random/rainbow colours · animated-on-every-render. **Colour mapping:** series use the brand ramp + semantic (green=positive/earned, amber=pending, red=negative); ≤5 series or aggregate. **Every chart:** title · honest empty state ("graph appears after…") · loading skeleton · accessible (label + data table fallback) · tabular-num tooltips. No fabricated/placeholder data (D-29).

## §10. Component library (build on shadcn/ui primitives; ~55 components)
Every component ships: variants · sizes · all states (default/hover/focus/active/disabled/loading) · light+dark tokens · a11y (role/label/keyboard) · mobile+desktop. No hard-coded colours — tokens only.

**Primitives:** Button (primary·secondary·ghost·danger·icon; sm/md/lg; loading) · IconButton · Input · Textarea · Select · Combobox · Checkbox · Radio · Switch · Slider · Badge · Chip/Pill · Avatar · Tag · Divider · Tooltip · Skeleton · Link.
**Cards:** Card (base: flat·raised·interactive) · StatCard · ChartCard · HeroBanner · AnnouncementBanner · NotificationCard · QuickActionCard · ReferralCard/ShareCard(QR·WhatsApp) · RewardCard · WalletCard · LeaderboardCard · AnalyticsCard · CourseCard · CertificateCard · VideoCard · AI-SuggestionCard · GettingStartedCard · ProfileCard · WidgetContainer.
**Data display:** DataTable (sort·filter·paginate) · TransactionTable · LeaderboardTable · ReferralTree · Timeline/ActivityFeed · ProgressRing · ProgressBar · StatValue · Calendar · KpiTile.
**Navigation:** Sidebar · SidebarItem · WorkspaceSwitcher · Topbar · Breadcrumb · Tabs · BottomNav · Pagination · Stepper · CommandPalette *(RESERVE — admin/power-user only; not on the Tier-2/3 consumer path per research)*.
**Feedback / overlays:** Modal · Drawer · Toast · Alert · ConfirmDialog · Popover · EmptyState · ErrorState · OfflineBanner · MaintenanceScreen · ComingSoon.
**Media / misc:** Carousel · Accordion · VideoPlayer · QRCode · ShareSheet · FileUpload · SearchBox.

### §10.2 Card families (styling rules)
| Family | Accent | Use | Rule |
|---|---|---|---|
| **Learning** | green | courses/progress/certs | green accent bar/icon, ProgressRing |
| **Financial** | gold accent + charcoal text | wallet/earnings/commission | gold **accent only**, numbers charcoal tabular, honest status line |
| **Analytics** | neutral + brand series | charts/trends | big number + trend + sparkline; chart lazy |
| **Action** | brand solid | quick actions/CTAs | one primary per group; icon+label |
| **Insight (AI)** | info/violet accent | Guru suggestions | "why this" + act/dismiss; real triggers only |
| **Reward** | gold + celebration | milestones/rewards | Lottie on capable; DR-034/035 language |
| **Warning** | amber/red | attention/urgent | icon+label, ranked, actionable |
| **Summary** | neutral | today's summary/overview | compact, scannable, links out |

## §11. Dashboard Widget Registry
Template per widget → **Purpose · Data source · Visibility/Permissions · Loading · Empty · Refresh · Interactions · Admin-controlled · AI-controlled · Future.**

- **Continue-Learning hero** — resume the active course. · LMS progress · all authed learners · skeleton · "Browse courses to begin" · on load + resume · Resume/expand · no · Guru may reorder by relevance · adaptive-path.
- **Stat cards (set)** — key numbers (courses/%/certs/streak · balance/held/earned/refs). · LMS + wallet + referrals · learner sees learn set / affiliate sees earn set (DR-040) · skeleton (number-only, no flatline) · honest zero ("0 — start") · on load · tap→detail · no · Guru highlights the one that matters · XP/rank when built.
- **Referral / Share** — link·copy·QR·WhatsApp + commission value. · referral code · all (hidden if Affiliate hidden) · instant · always usable · n/a · copy/share/QR · admin sets commission copy · Guru nudges when to share · contact-picker (future).
- **Wallet summary** — available/held/total. · wallet (DR-025) · affiliate · skeleton · "No earnings yet — share to start" · on load · tap→Wallet · no · — · statements.
- **Earnings / analytics chart** — over time. · Phase-B graphs · affiliate · skeleton · "graph appears after your first referral" · filter change · date/level filter · no · — · export.
- **Leaderboard** — rank by **completed referrals** (DR-034/035). · leaderboard · affiliate · skeleton · "unlocks when community starts learning" · periodic · view row · admin sets period/reward · no · —.
- **Reward milestone** — target/progress. · rewards engine · affiliate · skeleton · "no active reward" · on load · view/know-more · **admin-defined** · — · —.
- **AI insight** — next best action. · rules over real state · all · skeleton · "you're on track" · on load · act/dismiss · no · **AI-generated (real triggers only)** · deeper personalization.
- **Notifications** — grouped alerts. · notifications v1 · all · skeleton · "All caught up!" · realtime/poll · open/mark-read · admin can broadcast · — · open/click analytics (admin).
- **Activity timeline** — recent events. · composed events · all · skeleton · "Your activity will appear here" · on load · open entity · no · — · filters.
- **Getting-Started (zero-data)** — 3-step onboarding. · real lifecycle state · new users only · instant · n/a (this IS the empty layout) · on progress · do step · no · Guru guides · goal-based paths.
- **Payout-status timeline** — Earned→Pending→Available→Paid. · withdraw status · affiliate · skeleton · "no payouts yet" · on load · view · **payouts OFF (D-01) — truthful status, never fake Paid** · — · —.

## §12. State library (every surface — D-29)
Patterns (headline → 1-line context → single action), each with illustration where useful:
**Loading** (skeleton, never blank/spinner) · **Empty** (why + one CTA; celebratory "All caught up!" for active users) · **Offline / weak connection** (banner + retry) · **Error** (plain cause + retry) · **Permission / hidden** (graceful — no dead nav; DR-040 recomposition) · **Maintenance** · **Coming-Soon** (for RESERVED features — honest, not fake) · **No-Data / No-Results / No-Courses / No-Referrals** (contextual empties). Never a fabricated number/chart to fill a state.

## §13. Accessibility (WCAG 2.1 AA — non-negotiable)
Contrast ≥ AA (gold never fails-AA text) · visible focus rings (2px brand) · full keyboard nav + logical order · skip-to-content · ARIA roles/labels · form label associations + inline errors · **touch targets ≥44px** · `prefers-reduced-motion` honoured · screen-reader tested · charts have text/table fallback · colour never the only signal (icon+label). shadcn/Radix base gives most primitives a11y-correct.

## §14. Content & voice guidelines
**Language:** Hinglish in-product (icon+word), English in formal/legal. **Tone:** friendly, confident, motivating, plain — no jargon ("conversion rate"→"friends who joined"). **Money honesty (D-29/D-01):** "₹X earned" (not "ready to withdraw" while payouts OFF); never income guarantees; honest empty states. **CTA verbs:** Resume · Share · Withdraw · Ask Guru · Continue. **Recognition language (DR-035):** Contributor/Mentor/Community-Champion — never "team/downline/earnings-rank". **Gold rule:** decorative only, never body text on light.

## §15. Governance
Single source of truth for design + build. **Unit 1** implements these as tokens (CSS vars) + the shadcn-based component library; **no hard-coded colours/spacing/type downstream** — tokens only. Retire legacy `--gs-*` into this system (DR-039 P0-5). Dark tokens defined now, shipped later. Evolves via changelog + founder approval. Feeds: Component/Widget build, Motion spec (this §8 is its core), Admin CMS (widget admin-controlled flags), Feature Visibility (DR-040 permissions).

## Change log
- v1.0 — 2026-07-10 (Opus, steward) — grew the style-tile foundation (approved 9.2/10) into a full **Experience System**: experience principles + brand personality + design laws · colour/theme (incl. dormant dark tokens) · typography · spacing/radius/elevation · grid & layout · iconography (Lucide) · illustration · motion & interaction system · charts standards · ~55-component library + card families · dashboard widget regist