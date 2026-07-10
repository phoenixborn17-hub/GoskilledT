# GoSkilled — Complete Product Information Architecture (Blueprint v1.0)

> **Purpose.** The full application blueprint — every zone, workspace, page, sub-page, section, widget, component, user action, workflow, and relationship — before implementation. Companion to `Dashboard_Redesign_v3.0` (design/build spec) and `FeatureVisibility_System_v1.0`. Governance-consistent with DR-036/037/038 (auth/affiliate/model), DR-039 (workspace model · sidebar · deep-not-dense), DR-040 (feature visibility), DR-007 (commissions), DR-025/DR-001 (wallet/withdraw), DR-034/035 (learning-first recognition), D-01 (payouts OFF), D-29 (honest data).
>
> **Status: FROZEN v1.1 — founder-approved 2026-07-10 (scored 9.7/10; "approve as the Product IA, do not rewrite").** This is the **Application Blueprint.** The v3.0 build units consume it. Next layer = companion specs (Design System · Component & Widget Registry · Motion & Interaction · Admin CMS/IA). v1.1 folds in the 3 founder-flagged hierarchy gaps (Course content tree · Wallet sub-views · Referral Profile).
> **v2.0 (2026-07-10): additive scaling + production extension in §12** — zone renames · Platform Services (Zone E) · domain-based Admin Console · reserved future workspaces · omnipresent AI · Account split · auth/session hardening · Orders & Invoices · operational admin pages · user journeys · integrations registry. **Extends, does not rewrite;** §12 governs where it renames/extends the v1.x detail below. Principle: **reserve architecture now, build incrementally (80/20).**

## 0. Conventions
**Status legend (D-29 grounding):**
- `BUILT` — page/data exists today (Phase A–E merged on `main`); redesign = re-skin in place.
- `COMPOSITE` — NEW surface that only *reads/composes existing* data (e.g. Home hub); no new business logic.
- `NEW` — genuinely new feature (needs its own build); **parked, never faked** — renders "coming soon"/hidden until built + founder-approved.
Each page lists: **Route · Status · Data source · Purpose · Sections/Widgets · Components · User actions · Relationships.**
**Component vocabulary** (from the Unit-1 design system): StatCard, ChartCard, DataTable, Timeline, HeroBanner, ShareWidget (link·copy·QR·WhatsApp), GettingStartedCard, EmptyState, Skeleton, Modal, Drawer, Tabs, Badge, ProgressRing, NotificationList, Sidebar, WorkspaceSwitcher, Chip, Toast.
**Cross-cutting locks:** payouts OFF (D-01) — money surfaces show truthful status, never "Paid"; balance anchors only when >0; DR-038 L1-export / L2-L3 mobile-mask; DR-034/035 leaderboard by completed-referrals, learning-first language; every list has empty/loading/error states; every workspace is a **Feature-Visibility scope** (DR-040) — can be hidden per user/role/global with graceful recomposition.

## 1. Global sitemap
```
GoSkilled
│
├─ ZONE A · Public / Marketing (pre-login)
│   ├─ Home (landing) · About / What is GoSkilled · Courses · Course detail · Packages/Pricing
│   ├─ Webinar (register) · Blog · Videos · Contact · Help / FAQ
│   └─ Legal: Terms · Privacy · Refund Policy · Disclaimer
│
├─ ZONE B · Auth
│   ├─ Register (mobile+password+OTP+mandatory referral code) · No-code "Contact company"
│   ├─ Login (mobile+password+OTP) · Forgot/Reset password · OTP verify
│   └─ Welcome → Lesson 0 (onboarding)
│
├─ ZONE C · App (post-login, left sidebar)
│   ├─ 🏠 Home workspace        → §5.1
│   ├─ 🎓 Learning workspace     → §5.2
│   ├─ 💼 Affiliate workspace    → §5.3   (Feature-Visibility toggle target)
│   ├─ 🛍 Marketplace workspace  → §5.4
│   ├─ 🤖 AI workspace           → §5.5
│   └─ 👤 Account workspace      → §5.6
│
└─ ZONE D · Admin (separate app)
    ├─ Dashboard · Users · Payments · Leads · Review queue
    ├─ KYC review · Withdrawals · Catalog CRUD · Webinar admin
    ├─ Content CMS (hero/announcements/ordering) [NEW] · Feature Visibility control [NEW]
    └─ Audit log · Settings (payout-flag ceremony)
```

## 2. Navigation model
- **Left sidebar** (DR-039), workspace-themed (neutral Home · green Learn · gold Earn · AI accent · Account neutral). Groups: Home · Learn · Earn · Marketplace · AI · Account. Collapsible.
- **Workspace switch:** clicking a group swaps the workspace + theme; the active surface is always unmistakable.
- **Persistent Share** in the sidebar footer (referral link · copy · QR · WhatsApp) — visible in every workspace.
- **Mobile:** sidebar → drawer (hamburger, top-left) + a 4-item bottom bar (Home · Learn · Earn · Share). No search/Cmd+K.
- **Feature-Visibility (DR-040):** when the Affiliate workspace (or any module) is hidden, its sidebar group, bottom-bar item, share affordance, and every cross-workspace affiliate widget disappear; the sidebar + Home recompose so the app reads as a complete Learning product — **no gaps, no dead links** (server-side enforced; routes 404/redirect).
- **Top bar (per workspace):** breadcrumb/title · notifications bell · profile menu · (workspace-specific quick action).

---

## §5.1 🏠 HOME WORKSPACE (COMPOSITE — reads existing data; action-first hub)
Landing after login (DR-039). Answers "what do I do now / progress / next best action." Zero-data → GettingStartedCard, never empty widgets.

### Home · Dashboard (hub) — `/home` · COMPOSITE
- **Purpose:** central command; route users into the right workspace with today's priorities surfaced.
- **Sections/Widgets:** Welcome + dynamic greeting (real: name, streak, lifecycle) · Today's Summary (next lesson · today's webinar · wallet available *if >0* · streak) · Quick Actions (Continue Learning · Open Wallet · Refer · Claim Reward · Ask Guru · Join Webinar) · Priority Notifications (Today/Yesterday/Earlier) · Cross-workspace progress snapshot (learning % + referral count) · Announcements (admin CMS [NEW] → static real fallback) · ShareWidget · "Enter Workspace" cards (🎓 Learning · 💼 Affiliate — Affiliate card hidden if DR-040 off).
- **Components:** GettingStartedCard, StatCard, QuickActionGrid, NotificationList, HeroBanner, ShareWidget, WorkspaceCards.
- **User actions:** resume lesson · open any workspace · copy/share referral · claim reward · dismiss/great-through notifications · join webinar.
- **Relationships:** → every workspace; pulls from LMS, wallet, referrals, webinars, notifications.

### Home · Notifications — `/home/notifications` · BUILT (notifications v1)
- **Purpose:** full notification history, grouped + prioritized.
- **Sections:** grouped Today/Yesterday/Earlier · priority labels · filters (all/learning/earning/system).
- **Components:** NotificationList, Chip (filter), EmptyState ("All caught up!").
- **Actions:** open target · mark read/all-read · filter.
- **Relationships:** deep-links into the relevant workspace page.

### Home · Activity Feed — `/home/activity` · BUILT (composes existing events)
- **Purpose:** unified recent-activity timeline across learning + earning.
- **Sections:** Timeline (completed lesson · certificate unlocked · referral joined · reward claimed · wallet updated · quiz passed).
- **Components:** Timeline, Badge, EmptyState.
- **Actions:** open the referenced entity · filter by type.

---

## §5.2 🎓 LEARNING WORKSPACE (green)
Everything for skill-building. Design language: calm, motivating, progress-oriented. Deep-not-dense: clean first screen (greeting + Continue hero + priority), rich sections on scroll.

### Learn · Dashboard — `/learn` · COMPOSITE
- **Data:** LMS progress, certificates, quiz, gamification, webinars, referral.
- **Purpose:** the learner's home; resume + momentum.
- **Sections (progressive):** Welcome/momentum · **Continue-Learning hero** (thumb+course+%+Resume) · Hero Banner (admin) · Quick Actions · Referral nudge (link·copy·QR·WhatsApp + "share & earn") · **StatCards (≤4 above fold: Courses in progress · Overall % · Certificates · Streak; XP/Rank if built)** · Analytics tab (learning activity · course completion · weekly progress) · AI Insights (Guru rules-based) · Notifications · Recent activity · Rewards/Badges · Upcoming webinars · Recommendations (next course).
- **Components:** StatCard, ProgressRing, ChartCard, Timeline, HeroBanner, ShareWidget, GettingStartedCard.
- **Actions:** resume · browse · ask Guru · share · join webinar · claim badge.
- **Zero-data:** 3-step Getting-Started (pick course → first lesson → share).

### Learn · My Learning (overview) — `/learn/my-learning` · BUILT
- **Purpose:** all enrolled courses + progress at a glance.
- **Sections:** in-progress · completed · not-started · overall progress.
- **Components:** CourseCard (progress), ProgressRing, Tabs, EmptyState.
- **Actions:** resume · view certificate · rate.

### Learn · My Courses — `/learn/courses` · BUILT
- **Purpose:** owned courses + discover others (Buy CTA for non-owned).
- **Sections:** purchased grid · recommended/other with Buy.
- **Components:** CourseCard, Badge (owned), Buy CTA.
- **Actions:** open course · buy (→ checkout).

### Learn · Course Player — `/learn/course/[id]` · BUILT (signed-URL, leak-tested)
- **Purpose:** consume lessons.
- **Sections:** video player · lesson list/curriculum · progress · notes · resources · next-lesson · quiz entry · Ask-Guru panel.
- **Components:** VideoPlayer, LessonList, ProgressRing, Tabs, GuruPanel.
- **Actions:** play/complete lesson · mark done · open quiz · ask Guru · download resource.
- **Relationships:** → Quiz → Certificate.
- **Learning content hierarchy (canonical):** `Course → Modules → Lessons → Resources → Quiz → Assignments(future) → Certificate`. Player renders Modules→Lessons; Resources attach per-Lesson; Quiz per Module/Course; Certificate on completion. (Assignments = NEW/park.)

### Learn · Assignments — `/learn/assignments` · NEW (park; verify vs quiz engine)
- **Purpose:** submit/track assignments (if adopted).
- **Status:** not in current build — render "coming soon"/hidden until founder-approved + built. Never fabricate.

### Learn · Certificates — `/learn/certificates` (+ `/verify/[code]`) · BUILT
- **Purpose:** earned certificates + public verify + finish-line to next.
- **Sections:** earned grid · progress-to-next · share-certificate (WhatsApp — referral lever) · public verify page.
- **Components:** CertificateCard, ShareWidget, ProgressRing.
- **Actions:** download · share · verify.

### Learn · Webinars — `/learn/webinars` · BUILT
- **Purpose:** Mon–Fri training + Sunday concept; register + links.
- **Sections:** upcoming · registered · past/recordings · join links.
- **Components:** EventCard, Timeline, Badge.
- **Actions:** register · join · add-to-calendar.

### Learn · Guru AI (tutor) — `/learn/guru` · BUILT (also embedded in player)
- **Purpose:** AI tutor for course questions (income-red-teamed — no earnings claims).
- **Sections:** chat · course-context · suggested prompts.
- **Components:** ChatUI, PromptChips.
- **Actions:** ask · continue-in-context.
- **Note:** shares engine with the AI workspace (§5.5); here scoped to tutoring.

---

## §5.3 💼 AFFILIATE WORKSPACE (gold) — Feature-Visibility toggle target (DR-040)
Business/earning. Design: premium, confident, energetic. **Money-honesty locks throughout:** payouts OFF (D-01) — truthful status, "₹X earned" not "ready to withdraw", balance anchors only when >0; DR-038 masking; DR-034/035 recognition language. Entire workspace hideable (DR-040).

### Earn · Dashboard — `/earn` · COMPOSITE
- **Data:** wallet (DR-025), commissions ledger, referrals tree, Phase-B graphs, KYC, withdraw status, leaderboard, rewards.
- **Sections (progressive):** Welcome/earn-momentum · Hero Banner (campaigns) · Quick Actions (Withdraw·Share·Upload Leads·Commission Structure) · **Referral object** (link·copy·QR·WhatsApp + "Har referral pe ₹X") · StatCards (Available *if>0* · Held · Total earned · Active L1 · This-month refs · Rank) · always-visible honest **payout-status line** · Analytics tab (earnings·network·payments·funnel "X of Y joined") · AI insights · Notifications · Recent referral activity · Rewards · Campaigns · Recommendations.
- **Components:** StatCard, ChartCard, ShareWidget(QR), Timeline, Badge, EmptyState.
- **Actions:** copy/share/QR · request withdraw (gated) · upload leads · view network.
- **Zero-data:** 3-step (copy link → first share → first referral).

### Earn · Network (My Referrals) — `/earn/network` · BUILT (DR-038)
- **Purpose:** L1/L2/L3 tree + tables with filters.
- **Sections:** tree/graph · L1 table (**exportable CSV/XLSX**) · L2/L3 tables (**mobile-masked, non-exportable** + "privacy ke liye masked") · date + package filters · team growth graph (level filter).
- **Components:** TreeView, DataTable, ChartCard, Chip, ExportButton (L1 only).
- **Actions:** filter · export L1 · expand levels · open a referral's profile.

#### Earn · Referral Profile — `/earn/network/[referralId]` · BUILT/◭ (real data; L2/L3 masked per DR-038)
- **Purpose:** drill into a single referral.
- **Sections:** profile (masked by level — L1 full, L2/L3 mobile-masked) · their purchase(s) / package · commission history from them (by level) · relationship timeline (joined → purchased → commission events → completion).
- **Components:** ProfileHeader, DataTable, Timeline, Badge.
- **Actions:** view · (contact only if L1 & permitted). **No earnings/team framing (DR-035).**

### Earn · My Leads — `/earn/leads` · BUILT (encrypted, owner-scoped)
- **Purpose:** affiliate-uploaded leads.
- **Sections:** upload (CSV/form) · leads table + date filter · status.
- **Components:** DataTable, UploadWidget, Chip.
- **Actions:** upload · filter · edit/delete own lead.

### Earn · Wallet — `/earn/wallet` · BUILT (DR-025)
- **Purpose:** balances + complete money history.
- **Sub-views (tabs):** **Overview** (Available/Held/Total cards + growth graph) · **Transactions** (full ledger) · **Credits** (commissions earned, by level) · **Pending / Held** (48h countdown) · **Refund Adjustments** (clawbacks / negative entries, DR-025) · **Withdraw History** (requests + status) · **Statements** (monthly, downloadable).
- **Components:** StatCard, DataTable, ChartCard, Timeline, Tabs, ExportButton.
- **Actions:** view/filter tx · download statement · go to Withdraw. **Payouts OFF (D-01) — truthful status only.**

### Earn · Withdraw — `/earn/withdraw` · BUILT (execution OFF, D-01)
- **Purpose:** request payout within rules.
- **Sections:** eligible balance · rules (min ₹500 / max ₹25k / Monday window / manual 24h) · request form · status Applied→In-Progress→Paid · history · honest "payouts open [status]" banner.
- **Components:** Form, StatusTimeline, DataTable, Alert.
- **Actions:** request (validated; gated) · view history. **Never a fake "Paid."**
- **Relationship:** requires KYC complete.

### Earn · Rewards — `/earn/rewards` · BUILT
- **Purpose:** running reward + targets.
- **Sections:** current reward (target/last-date/description/achieve-graph) · progress · past · know-more.
- **Components:** ProgressRing, ChartCard, Badge.
- **Actions:** view details · (claim if applicable).

### Earn · Leaderboard — `/earn/leaderboard` · BUILT (DR-034/035)
- **Purpose:** recognition by **completed referrals / contribution — never earnings/team-size**.
- **Sections:** ranked list (learning-first) · your rank · tier (Contributor→Mentor→Community Champion) · running reward tie-in · zero-state ("unlocks when community starts learning").
- **Components:** DataTable, Badge, EmptyState.
- **Actions:** view profile row · filter period.

### Earn · Commission Structure — `/earn/commission-structure` · BUILT (content, DR-007)
- **Purpose:** explain the 2-package commission model.
- **Sections:** package tables (₹900/150/75 · ₹1,250/250/150) · how L1/L2/L3 works · earning eligibility (own-purchase required, DR-038) · FAQ.
- **Components:** Table, Accordion.
- **Actions:** read · share.

### Earn · KYC — `/earn/kyc` · BUILT (AES-256-GCM)
- **Purpose:** verification for withdrawal eligibility.
- **Sections:** name · email verify · mobile verify · WhatsApp verify · doc-type dropdown + address-doc upload · PAN upload+number · bank doc + name/acc/IFSC · UPI · status (under review ~24–48h).
- **Components:** Form, Upload, StatusBadge.
- **Actions:** submit · re-submit · track status. (Rate-limited; docs private/signed-URL.)

---

## §5.4 🛍 EXPLORE WORKSPACE (renamed from "Marketplace" — v2.0 §12.2)
Discovery + purchase. Bridges public catalog into the app.

### Marketplace · Explore Courses — `/marketplace/courses` · BUILT
- **Purpose:** browse full catalog (owned + buyable).
- **Sections:** category filters · course grid · search · featured · owned badges.
- **Components:** CourseCard, Filter, Badge.
- **Actions:** open detail · buy · add to learning.

### Marketplace · Course Detail — `/marketplace/course/[id]` · BUILT
- **Sections:** overview · curriculum · instructor · preview (free lesson) · price · reviews (honest "Founding Batch" framing, D-29) · Buy.
- **Actions:** preview · buy (→ checkout) · share.

### Marketplace · Membership Plans (Packages) — `/marketplace/plans` · BUILT
- **Purpose:** the 2 packages/pricing.
- **Sections:** package comparison · inclusions · price · Buy · commission note (learning-first).
- **Components:** PricingTable, Badge.
- **Actions:** select · checkout.

### Marketplace · Checkout — `/marketplace/checkout` · BUILT (Razorpay adapter; DR-023)
- **Purpose:** purchase (referral gate + OTP preserved).
- **Sections:** order summary · referral code (mandatory path) · payment (Razorpay) · confirmation.
- **Actions:** apply code · pay · → onboarding.
- **Locks:** provider adapter (no mock in prod); own-purchase unlocks earning eligibility (DR-038).

### Marketplace · Refer & Earn — `/marketplace/refer` · COMPOSITE
- **Purpose:** dedicated share hub (also surfaced everywhere).
- **Sections:** referral link · copy · QR · WhatsApp · commission value · how-it-works (share→friend buys→you earn) · your referral count.
- **Components:** ShareWidget(QR), Stepper.
- **Actions:** copy/share/QR. **Hidden if Affiliate hidden (DR-040).**

---

## §5.5 🤖 AI WORKSPACE (accent)
AI as a first-class workspace. **Guru tutor = BUILT; broader AI tools = NEW (park).** All AI output honest — no fabricated insights/earnings claims (D-29, income-red-team).

### AI · Guru Assistant — `/ai/guru` · BUILT
- **Purpose:** general AI assistant (learning + platform help).
- **Sections:** chat · history · suggested prompts · course-context switch.
- **Components:** ChatUI, PromptChips, HistoryList.
- **Actions:** ask · continue context · clear.

### AI · Insights — `/ai/insights` · COMPOSITE (rules-based on real state)
- **Purpose:** proactive, honest nudges ("Continue Module 4", "Webinar in 1h", "Invite 3 more to reach next tier").
- **Sections:** prioritized insight cards (only real triggers) · dismiss/act.
- **Components:** InsightCard, EmptyState ("Nothing urgent — you're on track").
- **Actions:** act (deep-link) · dismiss. **No fabricated insight.**

### AI · Tools/Studio — `/ai/tools` · NEW (park)
- **Purpose:** future AI utilities (content help, resume, practice).
- **Status:** not built — "coming soon"/hidden until scoped + approved. Never fake.

---

## §5.6 👤 ACCOUNT WORKSPACE
Profile + settings + support.

### Account · Profile — `/account/profile` · BUILT
- **Sections:** avatar · name/mobile · referral code · joined · level/tier · edit.
- **Actions:** edit profile · copy code.

### Account · KYC — `/account/kyc` · BUILT (alias of Earn·KYC; single source)
- Same as §5.3 KYC; surfaced under Account too. Hidden if Affiliate hidden (DR-040).

### Account · Settings — `/account/settings` · BUILT/◭
- **Sections:** password change · OTP/security · notification prefs · language (Hinglish) · theme (light-only launch) · privacy.
- **Actions:** update · manage sessions.
- **Locks:** password/security actions = user-performed (no auto).

### Account · Support — `/account/support` · BUILT/◭ (Help/FAQ + Contact)
- **Sections:** FAQ · contact form/WhatsApp · What-is-GoSkilled · tickets (if any).
- **Actions:** search FAQ · contact.

### Account · Logout — action · BUILT
- Ends session → public Home.

---

## §6. ZONE A — Public / Marketing (pre-login) · BUILT
| Page | Route | Purpose · key sections · actions |
|---|---|---|
| Landing | `/` | Value prop · hero · featured courses · webinar CTA · social proof (Founding-Batch, D-29) · Register/Login. |
| About / What is GoSkilled | `/about` | Mission · model · trust. |
| Courses | `/courses` | Public catalog · filters · detail links · Buy/Register. |
| Course detail | `/courses/[id]` | Overview · curriculum · preview · price · Buy. |
| Packages / Pricing | `/packages` | 2 packages · compare · Buy. |
| Webinar | `/webinar` | Mon–Fri + Sunday model · register form · links. |
| Blog | `/blog` | Articles (coming-soon shell if empty — no fake posts). |
| Videos | `/videos` | Video library (coming-soon shell). |
| Contact | `/contact` | Form · WhatsApp · email. |
| Help / FAQ | `/faq` | Grouped FAQ · search. |
| Legal | `/terms` `/privacy` `/refund-policy` `/disclaimer` | Layer-2 copy; refund page must match DR-025 mechanics. |
- **Nav:** public header (Home·Courses·Packages·Webinar·About·Contact) + **Register Free** + **Login**. Referral code captured from link (first-touch 30-day, DR-030).

## §7. ZONE B — Auth · BUILT (DR-036/038)
| Page | Route | Purpose · sections · actions · locks |
|---|---|---|
| Register | `/register` | mobile + password + OTP + **mandatory referral code** → validate → sponsor + L1/L2/L3 upline. No-code → "Contact company" (WhatsApp/email). Actions: submit·verify OTP. |
| Login | `/login` | mobile + password + OTP. Actions: login·request OTP. |
| Forgot/Reset password | `/forgot` `/reset` | reset via OTP. **User-performed credential entry only.** |
| Welcome → Lesson 0 | `/welcome` | one-time onboarding video as a real skippable LMS lesson → Home. |
| Onboarding (post-purchase) | `/onboarding` | preserved as-is (DR-030). |
- **Locks:** Supabase Auth single authority; passwords/OTP entered by user; referral gate mandatory both standalone + checkout.

## §8. ZONE D — Admin (separate app) · BUILT + NEW
| Page | Route | Status | Purpose |
|---|---|---|---|
| Dashboard | `/admin` | BUILT ◭ | KPIs + graphs (add graphs). |
| Users | `/admin/users` | BUILT | manage users/roles. |
| Payments | `/admin/payments` | BUILT | orders/transactions. |
| Leads | `/admin/leads` | BUILT | company leads. |
| Review queue | `/admin/review` | BUILT | content/flags. |
| KYC review | `/admin/kyc` | BUILT | approve/reject (403 + reveal-log; signed URLs). |
| Withdrawals | `/admin/withdrawals` | BUILT | queue + mark Applied→In-Progress→Paid (**execution gated, D-01**). |
| Wallet manage | `/admin/wallet` | ◭ NEW-ish | adjust/inspect balances (audit-logged). |
| Catalog CRUD | `/admin/catalog` | BUILT | courses/packages/lessons. |
| Webinar admin | `/admin/webinars` | BUILT | schedule + links. |
| **Content CMS** | `/admin/content` | **NEW** | hero banners · announcements · home messages · featured widgets · dashboard ordering · recommendations (DR-039 admin-controlled content). |
| **Feature Visibility** | `/admin/feature-visibility` | **NEW** | per-user/role/global flags for any module/workspace (DR-040); audit log; fail-safe default. |
| Audit log | `/admin/audit` | BUILT | immutable event log. |
| Settings | `/admin/settings` | BUILT | payout-flag ceremony + config. |
- **Locks:** admin authz; payout flag is a deliberate ceremony (D-01); access-control/permission changes = user-performed.

## §9. Key cross-workspace workflows
1. **Register → Learn → Certificate:** `/register` (code gate) → Welcome/Lesson 0 → `/learn` → Course Player → Quiz → Certificate (+ share-certificate = referral lever).
2. **Discover → Buy → Earning-eligible:** Marketplace → Course/Package → Checkout (Razorpay + code) → own-purchase unlocks earning eligibility (DR-038) → Earn workspace activates.
3. **Refer → Earn:** Share (Home/Learn/Earn/Marketplace) → friend registers with code (first-touch 30d) → friend buys → commission credited **HELD** → 48h (DR-025) → **AVAILABLE** → Withdraw (gated, D-01).
4. **KYC → Withdraw:** Earn/Account KYC (verify + docs) → admin approve → Wallet Available → Withdraw request (min ₹500/max ₹25k/Monday) → admin In-Progress → (Paid gated until D-01).
5. **Refund → clawback:** 48h refund → commission reversed via ledger (never becomes available); post-window → future-earnings adjustment, never bank clawback (DR-025).
6. **Reviewer/compliance mode (DR-040):** admin sets Feature Visibility (global/role/user) → Affiliate workspace + all affiliate widgets/routes hidden + recomposed → reviewer sees a complete Learning product; unhide restores exact state.
7. **Engagement loop:** AI Insights / notifications → nudge next best action → Home Qui