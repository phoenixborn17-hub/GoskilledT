# GPS-M5 — Premium Experience Module Spec v1.0

> **Genesis Stage 04 · DR-027 Module Spec (template v1.1) · the LAST feature module.** Flagship: Guru (AI Hinglish Tutor). Built premium-from-first-commit against DESIGN_DIRECTION v1.0 (frozen) — every surface ends "meets Design Direction v1.0", per §19 ritual.
> **DR-029/031 native:** zero blockers; pending values = LAUNCH_CONFIG rows; zero new scope beyond DR-026 Phase 5 / Blueprint Slice 1.5 frozen list.

**Status:** ❄️ **FROZEN v1.0** — founder-approved 2026-07-05 (incl. pre-freeze RAG-source review: Option B, Course Knowledge Base, optional-when-present) · **Owner:** Phoenix · **Steward:** Fable
**Module:** `ai (guru)` + `lms (quizzes/gamification)` + `notifications` + `pwa` · **Phase:** 5 (DR-026) · **Tier:** A for Guru engine/cost/schema + notification sends; B for UI
**Sources:** DESIGN_DIRECTION v1.0 (Signature Moments, 3 registers, §4.3 Guru) · Blueprint v1.1 §8 Slice 1.5 · GPS Master §5.6 · M2 §1E slots + M2/M3 §1D notification matrices · DR-021/025/029/030/031 · D-29 · Constitution Art 6 (agents draft, humans decide).
**Repo mirror:** `goskilled-vnext/docs/specs/GPS-M5_Premium_v1.0.md` (verbatim, authoritative for implementation).

---

## 1. Scope

**IN:** Guru v1 engine + UI (transcript-RAG, Hinglish) · quiz/assignment engine (admin-generated, learner-taken; wires the certificate "mandatory assignments" gate M2 deferred here) · ethical gamification v1 (streaks + milestones, derived data) · notifications v1 (transactional email via existing provider slot; WhatsApp deep-links only) · PWA shell (installable, offline app-shell) · **Signature Moments pass** (the 6 moments to Design-Direction bar) · shareable certificate card.
**OUT (Slice 3 / future — listed for clarity, not debate):** adaptive learning paths depth · full Hindi i18n · dark mode · offline lessons · WhatsApp BSP/nurture campaigns · community · 3D hero (the ONE slot stays unspent until LCP headroom data) · leaderboards · Jarvis conversational admin.

**Module-wide invariants:**
- **Guru is a course companion, NOT a general chatbot.** Answers ONLY from enrolled-course transcripts + lesson context (RAG). Out-of-scope questions → warm Hinglish redirect to course content. **D-29 hard guardrail: zero income/earnings talk — even if asked directly**; guardrail prompt-tested.
- **Agents draft, humans decide (Art 6):** Guru never writes to canon/DB state beyond its own chat log; quiz-gen output is DRAFT until admin approves/publishes.
- **Cost caps are architecture:** per-user daily message cap + global daily token budget (env, LC row) → cap hit = honest "Guru thak gaya aaj ke liye" state, never silent failure. Provider pattern: `AI_PROVIDER=mock|live` (mock = deterministic canned responses for dev/tests; prod guard extends).
- **Minimal schema:** streaks/XP/milestones are DERIVED from `LessonProgress`/event timestamps — no mutable counters. New tables only: quiz set (`Quiz`,`QuizQuestion`,`QuizAttempt`) + `GuruMessage` (usage/cost log, no PII beyond userId). All RLS-on.
- **Registers (Design Direction):** Guru/learning/gamification = Register 1 warm-rich; notification emails = Register 2 calm; admin quiz-gen = Register 3 efficient.
- Placeholder transcripts (`[PLACEHOLDER]`, seeded) power Guru until real recordings land (LC #7/8) — clearly labeled, dev/staging only. Loading contract + reduced-motion everywhere. No new analytics canon without registry update.

## 1A. Journey (module-level)
```
Student watches lesson → doubt → Guru panel (Hinglish answer from transcript, cited to lesson)
→ lesson end → quiz checkpoint (if published) → pass → progress + streak advances
→ course 100% + mandatory quizzes passed → certificate (existing engine) → share card
→ notifications: welcome / certificate-ready emails · streak = quiet motivation, never guilt
```

## 1B. State machines
**Guru session:** `IDLE → ANSWERING → ANSWERED(cited) | REDIRECTED(out-of-scope) | CAPPED(daily limit, honest state)`.
**Quiz:** `DRAFT(AI-generated) → PUBLISHED(admin approves) → attempts: IN_PROGRESS → PASSED/RETRY(unlimited, learning-first)`. Mandatory quizzes gate certificate eligibility (extends M2 `isEligibleForCertificate`).
**Streak:** derived — `active(n days) | resting(gap, warm zero-guilt copy)`. Never "lost/broken" language (ethical rule).

## 1C. Permissions
| Actor | Access |
|---|---|
| Student | Guru on OWN enrolled courses only; own quiz attempts; own streaks |
| Admin | Quiz-gen (draft→publish), Guru usage/cost dashboard card (admin §2.0), transcript upload via catalog CRUD |
| Server only | RAG retrieval, provider calls, cost accounting, eligibility computation |
| Guru itself | READ transcripts/lesson context only; writes ONLY GuruMessage log |

## 1D. Analytics + notifications
Events (canonical registry update in-ticket): guru-asked* · quiz-passed* · streak-milestone* · share-card*. Notifications v1 = EMAIL only via existing provider (Resend slot LC #22): welcome-on-register · certificate-ready · (receipt exists). Each has one-click unsubscribe + respects a `User.emailOptOut` (new nullable field). WhatsApp = `wa.me` deep-links only (BSP = FUTURE_IDEAS).

---

## 2. Page/Surface Contracts

### 2.0 Guru engine *(Tier A — the flagship's spine)*
- **Purpose:** doubt-solving in Hinglish from course transcripts — removes the English barrier; drives completion.
- **Contract:** RAG source = **Course Knowledge Base** — transcript chunks per lesson (primary, stored at catalog CRUD upload) + **optional-when-present:** founder-approved course notes · glossary · lesson metadata (already available). Same pipeline/chunk store for all types; Guru works fully on transcripts alone — notes/glossary enrich when provided (founder-approved text also strengthens D-29 control). No internet, no general LLM knowledge — corpus-only. (Embedding/retrieval implementation = builder's choice, simplest-that-works, documented in packet) → answer cites lesson ("Lesson 3 me dekha tha…") → Hinglish system prompt (copy slot, LC row) → D-29 guardrail block + out-of-scope redirect → cost caps (per-user daily N msgs, global budget; env + LC row) → `GuruMessage` log (tokens, cost, no message content beyond what's needed for context window? — log content, it's course Q&A, not PII; exclude from analytics).
- **Failure paths:** provider down → warm retry state; cap → honest capped state; empty transcript → "ye lesson abhi Guru ko sikhaya nahi gaya" honest state.
- **Dependencies:** Anthropic API key (NEW LC row) · transcripts (placeholder now, real at LC #7/8).
- **Status:** NOT STARTED. **Tests:** guardrail (income-question refusal), scope-redirect, cap behavior, citation presence.

### 2.1 Guru UI *(Register 1 — warm; fills M2 §1E slots)*
- **Purpose/feel:** "mera apna teacher" — warm, patient, always available.
- **Surfaces:** player companion panel (primary; slide-in, doesn't cover video on mobile) · dashboard "Ask Guru" card (activates the AI Mentor hub slot) · progress "explain my gap" entry.
- **CTA:** ask (voice-of-user placeholder examples in Hinglish). **States:** full loading contract + typing indicator + capped/error states per 2.0.
- **A11y:** chat log screen-reader-navigable; input labelled. **Status:** NOT STARTED.

### 2.2 Quiz engine + UI
- **Purpose:** practice → real skill + honest certificate gate (passive video ≠ skill).
- **Admin (Register 3):** in catalog CRUD per lesson/module: "Generate quiz draft" (Guru-assisted) → admin edits → publish; mark quiz mandatory-for-certificate (per course). Audited.
- **Learner (Register 1):** checkpoint after lesson (published only): MCQ, instant warm feedback ("Sahi! Kyunki…"), unlimited retries, pass = progress event + micro-delight. Progress/certificate copy already promises "mandatory assignments" (M2/FAQ) — this makes it true.
- **Certificate gate:** `isEligibleForCertificate` extends to require passed mandatory quizzes; **existing issued certificates unaffected** (no retroactive revocation).
- **Status:** NOT STARTED. **Tier A** for eligibility change + schema.

### 2.3 Ethical gamification v1 *(Register 1)*
- **Purpose:** momentum, never manipulation. Streak (derived: consecutive learning days) + milestones (first lesson, 25/50/75/100%, first quiz pass, streak 3/7/30).
- **Rules:** zero loss-aversion ("streak toota" banned — resting state instead) · zero social comparison · milestones celebrate REAL events only (D-29) · dashboard hub chip + progress page; quiet, not nagging.
- **Status:** NOT STARTED. Tier B (derived data, no money).

### 2.4 Notifications v1 *(Register 2 — calm)*
- **Scope:** welcome + certificate-ready emails (receipt exists); shared premium email template (brand header, plain warm copy, unsubscribe); `emailOptOut` respected everywhere; console provider until LC #22 key.
- **Status:** NOT STARTED. **Tier A** (sends + opt-out field).

### 2.5 PWA shell
- **Scope:** manifest + icons + service worker caching APP SHELL only (not lessons) + custom install prompt moment (post-first-lesson, not on landing). Lighthouse installable = pass.
- **Status:** NOT STARTED. Tier B.

### 2.6 Signature Moments pass *(Design Direction §SIGNATURE MOMENTS — the 6, to bar)*
- Homepage hero → full Register-1 experience (motion typography/gradient-mesh/scroll-story; §11 five jobs; NO 3D — slot stays unspent) · Registration welcome (belonging) · First Lesson complete (exists — elevate) · Purchase success (exists — elevate) · Certificate earned (design the moment; visual template LC #14 when founder provides) · Referral milestone (invite-count celebration, D-29).
- Each moment: Level-2/3 motion budget, reduced-motion fallback, §19 review ritual individually.
- **Status:** NOT STARTED. Tier B (marketing/UI; no route/data changes).

### 2.7 Shareable certificate card
- **Scope:** OG share image (name/course/serial, brand template) + share button (Web Share/`wa.me`) on progress + verify. Compliant social proof driver (Design Direction feature list — not new scope).
- **Status:** NOT STARTED. Tier B.

---

## 3. Close-out
| Gate | Requirement |
|---|---|
| Quality | Guru guardrail/scope/cap tests · quiz eligibility integration tests (incl. existing-certificate non-regression) · both AI provider modes tested · Lighthouse A11y 100 + PWA installable · §19 Design ritual per surface (registers + Consistency Test) · 320px + reduced-motion |
| Security | Guru: no PII to provider beyond course Q&A; API key env-only; cost caps server-enforced · quiz publish/audit rows in one $tx · RLS on new tables · unsubscribe honored |
| Content | Placeholder transcripts labeled; Hinglish copy slots = LC rows; zero fabricated data |
| Report | Review Packets per ticket (Tier-A mandatory) · LAUNCH_CONFIG rows in-ticket (Anthropic key · Guru budget values · system-prompt copy · quiz thresholds) · close-out per CLAUDE.md |

**3A. Module-new (canonical inventories update on close):** GuruPanel · GuruCard · QuizCheckpoint · QuizEditor(admin) · StreakChip · MilestoneMoment · ShareCard · email template. Tables: Quiz/QuizQuestion/QuizAttempt/GuruMessage (+`User.emailOptOut`).
**3B. Future (FUTURE_IDEAS, not here):** adaptive paths · WhatsApp BSP · voice Guru · community · leaderboards · Jarvis admin chat · 3D hero spend.
**3C. DoD:** every §2 surface exists w/ full state contract in correct register · §1B states test-proven · D-29 sweep (esp. Guru transcripts + gamification copy) · caps verified by test · LC rows current · Founder review ✅ · **Fable Tier-A PACKET review (engine/quiz-gate/notifications/schema)** ✅ · merge `--no-ff` · GPS Master §5.6/§19 + EXECUTION_QUEUE synced.

## 4. Coverage
8 contracts, all NOT STARTED (correct — Phase 5 fresh). Zero blockers: transcripts placeholder-powered (DR-029), key/budget/copy = LC rows. Recommended build order: 2.0→2.1 (flagship first) → 2.2 → 2.4 → 2.3 → 2.5 → 2.7 → 2.6 (moments last, over finished surfaces).

## 5. Founder freeze
- [x] **Approved & FROZEN** — Phoenix · date: 2026-07-05
Mirror to `docs/specs/` on kickoff · Claude Code builds (fresh branch off main; premium-from-first-commit; packets per ticket). Changes after freeze = v1.1 via changelog.
