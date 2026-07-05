# Review Packet — GPS-M5 §2.0 Guru engine (Tier A)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.0 (Guru engine — the flagship's spine) · **Tier:** A
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.0 · **Status:** parked for Fable Tier-A review (not merged)
**Companion files:** `gps-m5-2.0-guru-engine.diff` (full unified diff, 1570 lines) · `gps-m5-2.0-guru-engine.testout.txt`

## What was built

The Guru domain engine — no UI (that's §2.1). Guru is a **course companion, not a general chatbot**:
it answers only from the Course Knowledge Base (corpus-only RAG), refuses all income/earnings talk
(D-29), and is bounded by server-enforced cost caps. Provider pattern `AI_PROVIDER=mock|live`.

**Architecture (M1 principle — pure decision + thin adapter):**
- `modules/ai/guru/` — PURE, unit-tested, no I/O: `guardrail.ts` (D-29), `retrieval.ts` (corpus-only
  BM25-lite), `caps.ts` (cap decision), `prompt.ts` (Hinglish copy slots), `engine.ts` (the §1B state
  machine, dependency-injected), `schemas.ts` (Zod), `types.ts`.
- `lib/ai/` — thin adapters: `provider.ts` (mock + live via `@anthropic-ai/sdk`), `knowledge.ts`
  (Course-KB DB loader), `guru.ts` (wires real deps into the engine + persists the log + analytics).
- Schema: `LessonKnowledge` (corpus) + `GuruMessage` (usage/cost log) + enums `KnowledgeKind`,
  `GuruVerdict`. Migration `20260705020000_guru_engine` — **both tables RLS-ENABLED** (Golden Rule 15).
- Seed: `[PLACEHOLDER]` transcripts per lesson so Guru has a corpus in dev/staging (LC #7/8).

**§1B state machine** (all test-proven): `ANSWERED(cited) · REDIRECTED(out-of-scope / not-enrolled) ·
BLOCKED(D-29) · CAPPED · EMPTY(no corpus) · ERROR(provider down)`. Order is deliberate:
cap → D-29-on-question → resolve/enroll → retrieval → provider → D-29-on-answer → cite. A cap or
guardrail trip **never calls the model**.

## Key design decisions (flagging for review)

1. **Corpus-only retrieval = lexical BM25-lite, not embeddings** (spec: builder's choice, simplest-
   that-works, documented). No embedding service → no extra dependency/cost; out-of-scope is detected
   mechanically (zero content-term overlap → redirect, never hallucinate). Swappable behind the same
   interface later. `retrieval.ts`.
2. **D-29 guardrail runs on BOTH the question and the answer** — even if the model tries to talk income,
   the answer is replaced with a warm redirect (`engine.ts` step 6). Detector is high-precision
   Hinglish+English (`guardrail.ts`); `kamaal`/`kamal` deliberately excluded from the earn-stem.
3. **Model + cost caps are founder-configurable, not baked in.** `GURU_MODEL` defaults to
   `claude-haiku-4-5` (cost-appropriate for a high-volume tutor on a small corpus) — **flagged as a
   founder cost decision, LC #36.** The claude-api skill defaults to opus-4-8; I made it an explicit env
   slot + LC row so the founder owns the tier before `AI_PROVIDER=live`. Please confirm this is the
   intended treatment vs. hard-defaulting to opus.
4. **`AI_PROVIDER=mock` soft-warns in prod (not a hard guard)** — mirrors the email/analytics precedent:
   canned Guru is degraded, not unsafe (no money, D-29 + caps hold in both modes), and DR-029 lets the
   flagship ship on mock until the Anthropic key lands (LC #35). Spec said "prod guard extends" — I read
   that as extending the machinery with a soft-warn arm. Flagging in case a hard block was intended.
5. **Daily caps use IST calendar day** (Asia/Kolkata midnight) for the audience. `lib/ai/guru.ts`.

## Boundaries / security

- Zod at the boundary (`schemas.ts`). No PII to the provider beyond course Q&A. `ANTHROPIC_API_KEY`
  env-only. Cost caps server-enforced (per-user daily + global token budget). RLS on both new tables.
  `GuruMessage` content is course Q&A (not PII) and is excluded from the analytics corpus — the
  `guru_asked` event carries only verdict + cited-bool + provider name.

## Tests (`tests/guru-domain.test.ts` — 19, all green)

Guardrail income-refusal (8 Hinglish/English + 5 no-false-positives) · retrieval (chunk / in-scope /
out-of-scope / empty) · caps (user-daily / global / ordering) · mock provider (citation + determinism)
· engine state machine (ANSWERED+citation, BLOCKED-question-without-calling-model, BLOCKED-answer-side,
REDIRECTED-scope, EMPTY, CAPPED-without-calling-model, REDIRECTED-not-enrolled, ERROR).

```
Test Files  1 passed (1)
     Tests  19 passed (19)
```
Full suite: **230 passed / 30 files** (was 211/29). `tsc --noEmit` clean · prettier clean.

## Self-assessment (5 lines)

1. Engine logic is pure + exhaustively unit-tested; the DB/provider adapters are thin and typed.
2. **Live provider is untested without a real key** (LC #35 PENDING) — mock mode is fully tested; the
   live path is type-checked + a thin SDK call. This is the one BLOCKED-for-test item.
3. D-29 guardrail is deterministic and double-sided, but a keyword detector can't catch every phrasing —
   the system prompt is the second layer; a founder/Fable red-team pass on the prompt is worthwhile.
4. Cost-model choice (haiku default) and mock-in-prod soft-warn are judgement calls flagged above.
5. Schema + migration RLS verified live (`relrowsecurity=true` on both tables); seed idempotent.

## Tier-A checklist

- [x] `npm run typecheck` clean
- [x] Tests green (19 new unit + full suite 230/30; live-provider path is the documented BLOCKED item)
- [x] Architecture: adapters thin, all rules in `modules/ai/guru/*` (no rule re-implemented in adapters)
- [x] Security: Zod boundary, key env-only, caps server-enforced, RLS on new tables, no PII to provider
- [x] Performance: KB load is one grouped query per course; caps use two indexed aggregates
- [x] No Blueprint/Constitution/DR conflict · D-29 double-guarded
- [x] Docs updated (LAUNCH_CONFIG #35–37, .env.example, spec mirrored verbatim)
- [x] Git commit created — parked for Fable (not merged)
