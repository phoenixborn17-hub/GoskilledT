# GPS-M5 Premium — Module Close-out (§3C)

**Branch:** `gps-m5-premium` (cut from `main` `6c7b5ae`) · **Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` (FROZEN v1.0, mirrored verbatim).
**Status: BUILD COMPLETE — parked, NOT merged.** Merge to `main` is gated on **Fable's Tier-A PACKET review**.

## Contracts (spec §2) — all eight addressed

| § | Contract | Tier | Commit | State |
|---|---|---|---|---|
| 2.0 | Guru engine — Course-KB RAG (corpus-only), D-29 guardrail, cost caps, `AI_PROVIDER=mock\|live` | A | `8eba004` | ✅ COMPLETE (parked) |
| 2.1 | Guru UI — companion panel + dashboard card + progress explain-gap | B | `196ff20` | ✅ COMPLETE |
| 2.2 | Quiz engine + certificate gate (makes M2 "mandatory assignments" real) | A | `77e09d0` | ✅ COMPLETE (parked) |
| 2.3 | Ethical gamification — derived streaks + milestones | B | `4de0fb5` | ✅ COMPLETE |
| 2.4 | Notifications — welcome + cert-ready, idempotent + opt-out | A | `26bbde6` | ✅ COMPLETE (parked) |
| 2.5 | PWA shell — installable, security-first SW, offline, install prompt | B | `b4d2c41` | ✅ COMPLETE |
| 2.7 | Shareable certificate card — OG image + Web Share/wa.me | B | `62c162b` | ✅ COMPLETE |
| 2.6 | Signature Moments — **Certificate Earned** (new) + 5 elevations itemized | B | `5f40aa5` | ◑ PARTIAL (1 new moment shipped; 5 existing-surface elevations → PRODUCT_DEBT #10–14 per DR-031) |

## §3C Definition-of-Done

- [x] Every §2 surface exists with its full state contract in the correct register (Guru/quiz/gamification = R1; email = R2; admin quiz-gen = R3).
- [x] §1B state machines test-proven (Guru ANSWERED/REDIRECTED/BLOCKED/CAPPED/EMPTY/ERROR; quiz DRAFT→PUBLISHED + pass/retry; streak active/resting).
- [x] **D-29 sweep** — guardrail (income refusal, double-sided), gamification copy, email copy all assert zero earnings framing (tested).
- [x] **Caps verified by test** (per-user daily + global token budget; cap-before-model).
- [x] **Non-regression** — the sacred M2 certificate path proven intact (idempotent, serial immutable, anti-enumeration, no retroactive revocation).
- [x] RLS on every new table (`LessonKnowledge`, `GuruMessage`, `Quiz`, `QuizQuestion`, `QuizAttempt`, `EmailLog` — all verified live).
- [x] LAUNCH_CONFIG rows current (#35 Anthropic key · #36 Guru model/caps · #37 Guru copy · #38 quiz thresholds · #39 email copy · #40 PWA icon).
- [x] Review Packet per ticket (`docs/review-packets/gps-m5-2.*`).
- [ ] **Founder review** — pending (you).
- [ ] **Fable Tier-A PACKET review** — PENDING. Packets to review: 2.0 engine · 2.2 quiz/cert-gate · 2.4 notifications (engine/quiz-gate/notifications/schema). **This gates merge.**
- [ ] `merge --no-ff` into main — BLOCKED on Fable PASS.
- [ ] GPS Master §5.6/§19 + EXECUTION_QUEUE sync — Genesis docs (outside this repo) — founder to sync on merge.

## Quality signals

- **Tests:** full suite **256 passed / 35 files** (was 211/29 at branch cut → +45 tests). tsc clean, prettier clean.
- **Migrations (4):** `20260705020000_guru_engine` · `_030000_quiz_engine` · `_040000_notifications` — all additive/non-breaking, RLS-on.
- **New deps:** `@anthropic-ai/sdk` (Guru live provider). Providers reused where they existed (email console|resend).

## Open flags for Fable (carried in the packets)

1. **Guru model default** = `claude-haiku-4-5` treated as a founder cost decision (LC #36, env-configurable) rather than hard-defaulting to opus — confirm.
2. **`AI_PROVIDER=mock` soft-warns in prod** (DR-029 precedent) rather than a hard guard — confirm the reading of "prod guard extends".
3. **Live paths untested without keys** (Guru live, live quiz-gen, Resend) — LC #35/#22; mock/console fully tested. Documented BLOCKED-for-test.
4. **Unsubscribe token** = the user's cuid — a dedicated signed token is a noted hardening follow-up.

## Technical debt filed this module

PRODUCT_DEBT **#9** (Guru panel focus-trap, S3) · **#10–14** (§2.6 moment elevations for hero/register/purchase/referral/first-lesson, S3).

## NEXT MODULE

- **Recommended:** GPS-M5 is the LAST feature module (DR-026 Phase 5). Next = **(a) Fable Tier-A packet review → merge**, then **(b) the DR-031 Product Polish Sprints** (work PRODUCT_DEBT by severity — start with #9 focus-trap + the five §2.6 elevations), then **(c) launch-config finalization** (LC #35–40 + the pre-existing PENDING rows).
- **Why:** architecture + scope are frozen (DR-031); the remaining work is quality elevation + launch-gating, not new features.
- **Dependencies:** Fable review (merge gate) · founder assets/keys (LC rows) · legal (D-01, etc.).
- **Estimated work:** Fable review + merge = small; Polish Sprint (debt) = medium; launch-config = founder/legal-bound.
