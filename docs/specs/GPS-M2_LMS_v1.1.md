# GPS-M2 — LMS Module Spec v1.1

> **Genesis Stage 04 · DR-027 Module Spec.** Page contracts for the learning platform (green surface). Freezes at founder approval; implementation executes, never invents.
> **This spec's structure = the template for GPS-M3+** (journey → states → permissions → invariants → contracts → matrices → DoD).

**Status:** ❄️ **FROZEN v1.1** — founder-approved 2026-07-03 (v1.0 + founder CTO-review additions) · **Owner:** Phoenix · **Steward:** Claude
**Module:** `lms` (+ `catalog` reads, `video` provider) · **Phase:** 2 (DR-026)
**Sources:** GPS Master v1.1 §5.3 · Website Blueprint v1.1 §3/§7 · DESIGN_DIRECTION §4 · DR-021/022/023/026 · D-29 · M1 close-out (dashboard shell, player, nav already standing).
**Repo mirror:** canonical copy = this file; an identical in-repo mirror at `goskilled-vnext/docs/specs/GPS-M2_LMS_v1.1.md` is authoritative for implementation (1B pattern).

---

## 1. Scope

**IN:** dashboard shell + 4-tab nav · Learn tab (`/dashboard`) · My courses (`/dashboard/courses`) · course player (`/dashboard/learn/[courseSlug]`) · Progress (`/dashboard/progress`) · Profile (`/dashboard/profile`) · certificate issuance + public verify (`/verify/[serial]`) · Cloudflare Stream integration slot.
**OUT:** Guru/quizzes/adaptive/streaks/gamification (GPS-M5) · affiliate tab content (GPS-M3) · offline/PWA (Slice 1.5+) · any new feature not listed.

**Module-wide invariants:**
- **Access control is server-side; the client is NEVER trusted.** A locked lesson never receives a playback URL (existing rule — preserve).
- Entitlement = `lms/entitlement` domain functions (M1 spine): SB = chosen course; CB = both launch courses + future courses as released (DR-021).
- Video = provider pattern (DR-022): `mock` today → Cloudflare Stream signed URLs + HLS when account lands. YouTube embeds only for free previews.
- **Never blank + full loading contract:** every screen ships designed **empty / skeleton-loading / error / retry** states with a next action. (Offline state = PWA, Slice 1.5 — explicitly NOT M2.)
- Theme: green-forward tokens; mobile bottom tabs Learn · Progress · Earn · Profile; desktop sidebar. 320px-first, WCAG AA, `prefers-reduced-motion`, data-light (lesson lists paginate/lazy media).
- D-29: LMS language = learning outcomes only; no income framing anywhere (incl. certificates).
- Analytics: canonical events only (`lesson_complete`, course start/resume set per Blueprint §7).

---

## 1A. Learner Journey (module-level)

```
Purchase (M1 checkout) → Dashboard (goal-aware) → Start Lesson 1 → Resume loop (daily return)
→ Complete all lessons → Mandatory assignments → CERTIFIED (certificate issued)
→ /verify shareable proof → Next course (CB: as released · SB: catalog)
```
Every arrow = an analytics event (§1D) and a designed screen state (§1B). Onboarding goal (SKILL/INCOME/BOTH) tunes dashboard copy/ordering only — adaptive depth is GPS-M5.

## 1B. Learner State Machine (per course)

| State | Primary CTA | Badge/UI | Empty/edge state | Analytics event |
|---|---|---|---|---|
| NOT ENROLLED | Buy package (→ M1 checkout) | — | Guest sees free preview only | `view_package` |
| ENROLLED | "Start Lesson 1" | New | Never blank — start card | enrollment (webhook-side) |
| STARTED | "Continue" (deep-link) | In progress | Resume card on dashboard | course-start event* |
| IN PROGRESS | "Continue" + ring % | % ring | Stale >7d → gentle resume nudge (copy only, M2) | `lesson_complete` per lesson |
| COMPLETED | "Finish assignments" | 100% ring | Assignment list; honest requirement text | course-complete event* |
| CERTIFIED | "View certificate / Verify link" | Certified | Certificate card on progress tab | certificate-issued event* |

*Event names finalized against the canonical ~15-event set (Blueprint §7) at build — no new canon invented here.

## 1C. Permissions Matrix

| Actor | Access |
|---|---|
| Guest (unauthenticated) | Marketing pages + free-preview lessons only (no dashboard) |
| Student — Skill Builder | Own chosen course: full lessons, progress, certificate |
| Student — Career Booster | Both launch courses + future courses **as released** (DR-021) |
| Admin (role claim) | Admin surfaces (GPS-M4); no special LMS bypass in learner UI |
| Server only | Playback URLs, certificate issuance, progress writes (client never trusted) |

## 1D. Analytics + Notification-trigger Matrix *(consolidated; notifications = future context, design reference only)*

| Trigger | Analytics (canonical set) | Future notification (Slice 1.5+ email/WhatsApp — NOT built in M2) |
|---|---|---|
| Enrollment success | purchase (M1) | Welcome + start-learning nudge |
| Lesson complete | `lesson_complete` | — (streak nudges = GPS-M5) |
| Course complete | course-complete* | Assignment reminder |
| Certificate issued | certificate-issued* | Certificate-ready + share prompt |
| New course released (CB) | release event* | "Included in your package" announcement |

## 1E. AI hooks (TODO markers only — zero implementation in M2)

Guru (GPS-M5) entry-point slots reserved in layout: dashboard (ask-a-doubt card slot) · player (companion panel slot) · progress (explain-my-gap slot). Slots = commented placeholders/layout headroom, no UI shipped.

---

## 2. Page Contracts

### 2.0 Dashboard shell + nav *(shared contract — already standing from M1 work)*
- **Purpose:** authenticated frame for all learner surfaces; auth guard (server-side + middleware defence-in-depth).
- **Sections:** desktop sidebar / mobile bottom tab bar (4 tabs); content padded clear of both.
- **Components:** `DashboardNav` (existing). **A11y:** current-tab `aria-current`; tab targets ≥44px.
- **Status:** IN DEVELOPMENT (standing; close-out verifies a11y + 320px).

### 2.1 Learn tab — `/dashboard`
- **Purpose:** "continue where you left off" in one glance; the daily-return screen.
- **Primary CTA:** Continue Learning (deep-link to next incomplete lesson).
- **Sections:** goal-aware greeting (uses `User.goal` from onboarding — DESIGN_DIRECTION §4.2; simple ordering/copy only, adaptive depth = GPS-M5) → Continue Learning card → progress ring summary → enrolled courses grid. **Empty state:** purchased-but-not-started → "Start Lesson 1"; no enrollment → checkout CTA (existing).
- **Animations:** progress-ring fill on view (IO); reduced-motion = static. **Components:** ProgressRing, Card, Button.
- **Content source:** `lib/lms/queries.getEnrolledCourses` + catalog.
- **Dependencies:** auth session; enrollments (payments). **Responsive:** single column; ring scales.
- **A11y:** ring has text alternative (% complete). **SEO:** noindex (authenticated).
- **Status:** IN DEVELOPMENT (built; verify contract details at close-out).

### 2.2 My courses — `/dashboard/courses`
- **Purpose:** full entitlement view — what I own, what's coming (honest CB roadmap).
- **Primary CTA:** per-course → player.
- **Sections:** enrolled courses (progress + resume) → **CB only:** "Included in your package — as released" section listing coming-soon catalog courses with honest labels (DR-021 wording; no dates promised) → SB: upsell-free note of their chosen course (no dark-pattern upsell pressure).
- **Animations:** none load-bearing. **Components:** CourseCard variant (dashboard), ProgressRing, Badge ("As released").
- **Content source:** entitlement (`PackageCourse` + CB flag) + catalog statuses.
- **Dependencies:** DR-021 entitlement functions (done). **Responsive:** 1-col → 2-col ≥768px.
- **A11y:** coming-soon cards non-interactive, announced as such. **SEO:** noindex.
- **Status:** NOT STARTED (route missing — the main M2 build item).

### 2.3 Course player — `/dashboard/learn/[courseSlug]`
- **Purpose:** the product itself — watch, complete, resume; friction-free on 4G.
- **Primary CTA:** play current lesson; Mark complete → auto-advance to next.
- **Sections:** player (16:9, poster, resume position) → lesson title/description → lesson list (modules, locked icons, completed checks, free-preview badge) → mark-complete → next-lesson affordance. **Failure paths:** video load error → retry + "report issue" (WhatsApp support deep-link); slow network → HLS adaptive (Stream) + poster-first.
- **Animations:** completion check micro-interaction (purposeful delight); reduced-motion = instant state.
- **Components:** LessonPlayer (existing; extend for Stream HLS via provider), lesson-list.
- **Content source:** catalog (`Lesson.videoAssetId` = Stream UID) — **recorded lessons = CONTENT (founder)**.
- **Dependencies:** video provider (`mock`→`stream`, EXTERNAL: Stream account); entitlement; `completeLesson` (exists).
- **Responsive:** player full-bleed at 320px; lesson list below (not sidebar) on mobile.
- **A11y:** keyboard-operable controls; captions slot (Hinglish captions when content lands); locked state announced.
- **SEO:** noindex. **Analytics:** `lesson_complete`, resume events.
- **Status:** IN DEVELOPMENT + CONTENT/EXTERNAL BLOCKED (lessons, Stream).

### 2.4 Progress — `/dashboard/progress`
- **Purpose:** visible momentum → completion motivation (honest, not manipulative).
- **Primary CTA:** Resume per course.
- **Sections:** per-course progress cards (ring + lessons done/total + resume) → overall summary → **certificate slot:** at 100% + mandatory assignments (per FAQ/Terms wording) show "Certificate earned → view/download"; below 100% show honest requirement text. **Empty state:** never blank (existing).
- **Components:** ProgressRing, Card, certificate card (new, small).
- **Dependencies:** LessonProgress (exists); certificate issuance (§2.6).
- **A11y:** progress as text + visual. **SEO:** noindex.
- **Status:** IN DEVELOPMENT (built; certificate slot = new).

### 2.5 Profile — `/dashboard/profile`
- **Purpose:** identity + preferences + clean exit.
- **Primary CTA:** save changes; Logout (confirm).
- **Sections:** name/email (editable, Zod-validated) → goal (radiogroup, same semantics as onboarding) → phone (read-only — auth identity, change = support) → logout. **No self-serve account deletion in M2** (support-mediated; DPDP flows designed with legal pages — LEGAL workstream).
- **Components:** Input/Label/Button/Card; radiogroup.
- **Dependencies:** auth session; user-sync. **A11y:** labels, error text `aria-describedby`. **SEO:** noindex.
- **Status:** IN DEVELOPMENT (built; verify edit paths at close-out).

### 2.6 Certificates + public verify — `/verify/[serial]`
- **Purpose:** verifiable proof of skill — the "certificate" leg of *skill → certificate → earn*; anti-fake by design.
- **Issuance contract (domain logic):** on course 100% completion + mandatory assignments (per Terms), issue `Certificate` with unique serial; immutable once issued; downloadable PDF; event-logged. **Wording carries zero income framing (D-29).**
- **Verify page (public):** input/URL serial → shows learner name, course, issue date, VALID/INVALID state. No PII beyond name; no enumeration (rate-limited, unguessable serials).
- **Primary CTA (verify):** none (proof page); soft link → `/courses`.
- **Components:** certificate card, PDF template (**certificate visual design = FOUNDER/brand input — one-time asset**).
- **Dependencies:** `Certificate` model (exists in schema) · completion rules · PDF generation (server-side).
- **Responsive/A11y:** print-clean PDF; page WCAG AA. **SEO:** verify page indexable-safe (noindex optional; canonical).
- **Status:** NOT STARTED. **Note:** Blueprint places this in Slice 1.5 — M2 builds the engine (issuance + verify + PDF); it activates when real completions exist. FOUNDER BLOCKED only on the visual template.

---

## 3. Module close-out contract (DR-026 rules)

| Gate | Requirement |
|---|---|
| Quality | typecheck/lint/tests green (entitlement + issuance = unit-tested; player access-control = integration-tested — locked lesson never returns a URL) · Lighthouse A11y 100 on dashboard/player/progress/profile/verify · 320px + reduced-motion pass |
| Security | server-side access control verified (no playback URL leak) · verify page rate-limited, no enumeration · no PII beyond name on public verify |
| Content | zero dummy lessons where real content expected (stop-and-ask) · mock video clearly labeled in dev only |
| Report | MODULE STATUS per template · blocked items with exact reasons · NEXT MODULE recommendation |

**Expected close-out blockers (known now):** recorded lessons (CONTENT — founder) · Cloudflare Stream account (EXTERNAL) · certificate visual template (FOUNDER) · 5 coming-soon catalog seeds (CONTENT, carried from M1).

## 3A. Module component + API index *(module-new items only — canonical inventories live in GPS Master §9/§12; update those on close-out, don't duplicate here)*

- **Components (new in M2):** dashboard CourseCard variant · CertificateCard · certificate PDF template · lesson-list (extracted from player if reused). Existing: DashboardNav, ProgressRing, LessonPlayer.
- **Data access (new in M2):** `getEnrollmentsWithRoadmap` (My courses, DR-021 CB view) · certificate issuance domain fn + `getCertificateBySerial` (verify, rate-limited) · profile-update server action. Existing: `lib/lms/queries.*`, `completeLesson`.

## 3B. Future extensions (roadmap reference ONLY — not M2 scope)

Guru AI (slots per §1E) · quizzes/assignments engine beyond mandatory-list · streaks/XP/gamification · adaptive paths · community · offline/PWA · Hindi i18n. All = GPS-M5/Slice 1.5+; nothing here justifies scope creep in M2.

## 3C. Definition of Done (objective merge/close gate)

- [ ] Every §2 page exists (or documented-BLOCKED) with empty/skeleton/error/retry states
- [ ] §1B states render correct CTA/badge on every surface
- [ ] §1C permissions integration-tested (incl. locked-lesson URL leak test)
- [ ] Mobile 320px + reduced-motion verified · Lighthouse A11y 100 · tests green
- [ ] Analytics events live per §1D (canonical names)
- [ ] Founder review ✅ · Fable Tier-A review (access-control + issuance paths) ✅
- [ ] Merged `--no-ff` · close-out report · **GPS Master §5/§19 + §9/§12 inventories updated**

## 4. Coverage summary

7 contracts: 5 IN DEVELOPMENT (standing from M1-era work, contract-verify at close-out) · 2 NOT STARTED (**My courses** — main build; **certificates+verify engine**). No new decisions — everything traces to DR-021/022/026, Blueprint §3/§7, DESIGN_DIRECTION §4, or the frozen FAQ/Terms wording.

## 5. Founder freeze

- [x] **Approved & FROZEN** — Phoenix · date: 2026-07-03
Mirror to `docs/specs/` on kickoff · implementation may build M2. Changes after freeze = v1.2 via changelog.
