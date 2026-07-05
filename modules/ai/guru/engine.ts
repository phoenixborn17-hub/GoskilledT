// GPS-M5 §2.0 — Guru turn engine. This holds ALL the decision logic for one Guru turn (§1B state
// machine) and is DEPENDENCY-INJECTED so it's unit-testable without a DB or network: the adapter
// (lib/ai/guru.ts) supplies real data loaders + the provider; tests supply fakes. Adapters stay thin,
// no rule is re-implemented outside this file.
//
// Order is deliberate (defence-in-depth):
//   cost cap (architecture) → D-29 guardrail on the QUESTION → resolve/enroll → corpus retrieval
//   → provider → D-29 guardrail on the ANSWER → cite. A cap or guardrail trip never calls the model.

import { decideCap, cappedMessage } from "./caps";
import { hasIncomeIntent, GURU_INCOME_REDIRECT } from "./guardrail";
import { retrieve } from "./retrieval";
import {
  GURU_OUT_OF_SCOPE,
  GURU_EMPTY_LESSON,
  GURU_ERROR,
  GURU_NOT_ENROLLED,
} from "./prompt";
import type {
  Citation,
  GuruGeneration,
  GuruGenerationInput,
  GuruTurn,
  KnowledgeChunk,
} from "./types";

export interface LessonRef {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
}

export interface GuruDeps {
  /** Resolve the lesson's course + citation metadata, or null if the lesson doesn't exist. */
  resolveContext(lessonId: string): Promise<LessonRef | null>;
  /** Guru is enrolled-courses-only (§1C). */
  isEnrolled(userId: string, courseId: string): Promise<boolean>;
  /** The whole course's Knowledge Base as retrieval chunks (may be empty → EMPTY state). */
  loadKnowledge(courseId: string): Promise<KnowledgeChunk[]>;
  /** Today's per-user message count + today's global token spend (for the two caps). */
  usage(
    userId: string,
  ): Promise<{ userMsgsToday: number; globalTokensToday: number }>;
  limits: { dailyMsgCap: number; dailyTokenBudget: number };
  systemPrompt: string;
  /** Call the model (mock or live). Throws → warm ERROR state. */
  generate(input: GuruGenerationInput): Promise<GuruGeneration>;
  /** How many top chunks to retrieve + send as context. */
  topK?: number;
}

export interface GuruAsk {
  userId: string;
  lessonId: string;
  question: string;
}

/** A turn that spent no tokens (cap/guardrail/redirect) — keeps the return shape uniform. */
function zeroTurn(verdict: GuruTurn["verdict"], answer: string): GuruTurn {
  return {
    verdict,
    answer,
    citations: [],
    promptTokens: 0,
    completionTokens: 0,
    costPaise: 0,
  };
}

function citationsFor(chunks: KnowledgeChunk[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of chunks) {
    if (seen.has(c.lessonId)) continue;
    seen.add(c.lessonId);
    out.push({
      lessonId: c.lessonId,
      lessonTitle: c.lessonTitle,
      lessonOrder: c.lessonOrder,
    });
  }
  return out;
}

export async function runGuruTurn(
  ask: GuruAsk,
  deps: GuruDeps,
): Promise<GuruTurn> {
  // 1) Cost caps are architecture — checked first; a cap hit is an honest state, never a failure.
  const usage = await deps.usage(ask.userId);
  const cap = decideCap({
    userMsgsToday: usage.userMsgsToday,
    globalTokensToday: usage.globalTokensToday,
    dailyMsgCap: deps.limits.dailyMsgCap,
    dailyTokenBudget: deps.limits.dailyTokenBudget,
  });
  if (cap.capped) return zeroTurn("CAPPED", cappedMessage(cap.reason!));

  // 2) D-29 hard guardrail on the QUESTION — refuse income/earnings talk before the model is called.
  if (hasIncomeIntent(ask.question))
    return zeroTurn("BLOCKED", GURU_INCOME_REDIRECT);

  // 3) Resolve lesson → course; enforce enrolled-courses-only (§1C).
  const ctx = await deps.resolveContext(ask.lessonId);
  if (!ctx) return zeroTurn("ERROR", GURU_ERROR);
  if (!(await deps.isEnrolled(ask.userId, ctx.courseId)))
    return zeroTurn("REDIRECTED", GURU_NOT_ENROLLED);

  // 4) Corpus retrieval (corpus-only). Empty corpus → honest "not taught yet"; no overlap → redirect.
  const knowledge = await deps.loadKnowledge(ctx.courseId);
  const r = retrieve(ask.question, knowledge, { topK: deps.topK ?? 3 });
  if (r.empty) return zeroTurn("EMPTY", GURU_EMPTY_LESSON);
  if (r.outOfScope) return zeroTurn("REDIRECTED", GURU_OUT_OF_SCOPE);

  const context = r.hits.map((h) => h.chunk);

  // 5) Generate. Provider failure → warm retry state (tokens already zero).
  let gen: GuruGeneration;
  try {
    gen = await deps.generate({
      question: ask.question,
      systemPrompt: deps.systemPrompt,
      context,
    });
  } catch {
    return zeroTurn("ERROR", GURU_ERROR);
  }

  // 6) D-29 guardrail on the ANSWER — even if the model tries, no income talk leaves Guru. We still
  //    account the tokens we spent (the call happened), but replace the answer with the safe redirect.
  if (hasIncomeIntent(gen.answer)) {
    return {
      verdict: "BLOCKED",
      answer: GURU_INCOME_REDIRECT,
      citations: [],
      promptTokens: gen.promptTokens,
      completionTokens: gen.completionTokens,
      costPaise: gen.costPaise,
    };
  }

  // 7) Cited answer.
  return {
    verdict: "ANSWERED",
    answer: gen.answer,
    citations: citationsFor(context),
    promptTokens: gen.promptTokens,
    completionTokens: gen.completionTokens,
    costPaise: gen.costPaise,
  };
}
