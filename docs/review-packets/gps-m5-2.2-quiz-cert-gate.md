# Review Packet — GPS-M5 §2.2 Quiz engine + certificate gate (Tier A)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.2 · **Tier:** A · **NOT merged** (consolidated Fable pass).
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.2 · **Companions:** `gps-m5-2.2-quiz-cert-gate.diff` (1779 lines) ·
`.testout.txt` · verification shots in `docs/qa/GPS-M5/quiz/` (git-ignored).

## What was built

The quiz engine that makes M2's promised "mandatory assignments" certificate gate real — touching the
**sacred M2 certificate engine** as narrowly as possible.

- **Schema** (Tier-A): `Quiz` · `QuizQuestion` · `QuizAttempt` + `QuizStatus` enum. Migration
  `20260705030000_quiz_engine` — **all three tables RLS-ENABLED** (Golden Rule 15, verified live).
- **Pure grading** (`modules/lms/quiz.ts`): `gradeAttempt` (threshold, unanswered, empty) +
  `validateQuizForPublish`. Fully unit-tested.
- **Certificate gate** (`lib/lms/certificate.ts`): `isEligibleForCertificate` now requires all lessons
  complete **AND** all PUBLISHED mandatory quizzes passed. `passedAllMandatoryQuizzes` **returns true
  when a course has none** → the change can only ADD a requirement, never relax one; issuance stays
  idempotent + immutable; no already-issued cert is ever revoked.
- **Admin** (Register 3, audited): `saveQuizDraft` · `generateQuizDraft` (Guru-assisted) · `publishQuiz`
  · `unpublishQuiz` — each an `AdminAction` in the same `$transaction`. Art 6: **generation only
  DRAFTS; publish is an explicit human decision.** UI: `AdminQuizManager` in `/admin/catalog/[courseId]`.
- **Learner** (Register 1): `submitQuizAttempt` (server-graded, answer key never sent pre-grade,
  enrolled-only, unlimited retries, `quiz_passed` event, best-effort cert issuance on pass). UI:
  `QuizCheckpoint` on the player — MCQ, warm per-question feedback, pass-delight (confetti), retry.
- Provider gains `draftQuizQuestions` (mock deterministic + live JSON) — corpus-grounded.

## Mandatory NON-REGRESSION suite (the sacred requirement) — `tests/quiz-cert-gate.integration.test.ts`

All green (5 tests), alongside the untouched M2 `certificate.test.ts` (5, still green):
1. **No quizzes** → still eligible on 100% completion; **issuance idempotent + serial immutable** (count=1).
2. **PUBLISHED mandatory quiz gates** issuance until passed; a **failing** attempt doesn't open it; retries allowed.
3. **DRAFT or non-mandatory** quizzes do **NOT** gate (only PUBLISHED + mandatory).
4. **No retroactive revocation** — a cert issued before a mandatory quiz is added stays valid; re-issue returns the same serial.
5. **Unknown serial → invalid** (anti-enumeration lookup behaviour intact).

```
tests/quiz-domain.test.ts (6) + quiz-cert-gate (5) + certificate (5)  → 16 passed
Full suite: 241 passed / 32 files (was 230/30). tsc + prettier clean.
```

## Security / architecture

- Zod at both boundaries; admin RBAC (`getAdminUser`) on every mutation; **audit row in the same tx**.
- RLS on all three new tables. Answer key server-only until grading. Enrolled-only submission.
- Pure rules in `modules/lms/quiz.ts`; adapters thin; the M2 engine's issuance/serial/verify code is
  **unchanged** except the additive gate call.
- `quiz_passed` analytics carries `score_percent` only — no answer content (PII-safe).

## Verified in-browser (mock provider)

Learner checkpoint renders below the video (badge, "Certificate ke liye zaroori", MCQ, selected-state),
submit → **passed 100%** with `quiz_passed` event; admin manager renders the full draft→edit→publish
flow (Guru-draft button, mandatory toggle, pass%, per-lesson status). No console/hydration errors.

## Self-assessment (5 lines)

1. The certificate gate is additive-only and proven non-regressive by 5 targeted tests + the intact M2 suite.
2. Schema/migration RLS verified live; issuance idempotency + serial immutability + no-revocation all tested.
3. Admin flow honours Art 6 (draft→human-publish), fully audited; learner flow is server-graded + enrolled-gated.
4. **Live quiz-gen is untested without a key** (mock deterministic path is tested) — same LC #35 caveat as §2.0.
5. `answers` is stored via a slightly awkward Json cast (compiles + tested); a tidy-up is noted, non-blocking.

## Tier-A checklist

- [x] `npm run typecheck` clean · prettier clean
- [x] ALL tests green — unit + live integration (non-regression suite is the centrepiece)
- [x] Architecture: pure rules in modules/, thin adapters, M2 engine untouched beyond the additive gate
- [x] Security: Zod boundaries, admin RBAC + audit-in-tx, RLS on new tables, answer key server-only
- [x] Performance: gate = 2 scoped queries; no N+1
- [x] No Blueprint/Constitution/DR conflict · Art 6 (agents draft, humans decide) honoured
- [x] Docs updated (LAUNCH_CONFIG #38; PRODUCT_DEBT #9 focus-trap follow-up from §2.1)
- [x] Git commit created on branch — NOT merged (awaiting consolidated Fable PASS)
