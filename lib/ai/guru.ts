// GPS-M5 §2.0 — Guru adapter. THIN: wires real data loaders + the provider + env limits into the
// pure engine (modules/ai/guru/engine.ts), persists the usage/cost log, and emits the analytics
// event. No decision rules live here — they're all in the engine.
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { isEnrolled } from "../lms/queries";
import { track } from "../analytics/track";
import { getAiProvider } from "./provider";
import { resolveLessonContext, loadCourseKnowledge } from "./knowledge";
import {
  runGuruTurn,
  type GuruAsk,
  type GuruDeps,
} from "../../modules/ai/guru/engine";
import { GURU_SYSTEM_PROMPT } from "../../modules/ai/guru/prompt";
import {
  DEFAULT_DAILY_MSG_CAP,
  DEFAULT_DAILY_TOKEN_BUDGET,
} from "../../modules/ai/guru/caps";
import type { GuruTurn } from "../../modules/ai/guru/types";

/** UTC instant of the most recent IST (Asia/Kolkata) midnight — the "daily" boundary for caps. */
function startOfIstDay(now = new Date()): Date {
  const IST_OFFSET_MIN = 330;
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const istMidnightUtc =
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) -
    IST_OFFSET_MIN * 60_000;
  return new Date(istMidnightUtc);
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function realUsage(
  userId: string,
): Promise<{ userMsgsToday: number; globalTokensToday: number }> {
  const since = startOfIstDay();
  const [userMsgsToday, agg] = await Promise.all([
    prisma.guruMessage.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.guruMessage.aggregate({
      _sum: { promptTokens: true, completionTokens: true },
      where: { createdAt: { gte: since } },
    }),
  ]);
  const globalTokensToday =
    (agg._sum.promptTokens ?? 0) + (agg._sum.completionTokens ?? 0);
  return { userMsgsToday, globalTokensToday };
}

/**
 * Ask Guru one question in a lesson's context. Returns the turn (verdict + answer + citations) and
 * persists a GuruMessage log row. Input should already be Zod-validated (modules/ai/guru/schemas).
 */
export async function askGuru(ask: GuruAsk): Promise<GuruTurn> {
  const provider = getAiProvider();
  // Resolve context once so we can log courseId even on early-exit states.
  const ctx = await resolveLessonContext(ask.lessonId);

  const deps: GuruDeps = {
    resolveContext: async () =>
      ctx
        ? {
            courseId: ctx.courseId,
            lessonId: ctx.lessonId,
            lessonTitle: ctx.lessonTitle,
            lessonOrder: ctx.lessonOrder,
          }
        : null,
    isEnrolled: (userId, courseId) => isEnrolled(userId, courseId),
    loadKnowledge: (courseId) => loadCourseKnowledge(courseId),
    usage: realUsage,
    limits: {
      dailyMsgCap: intEnv("GURU_DAILY_MSG_CAP", DEFAULT_DAILY_MSG_CAP),
      dailyTokenBudget: intEnv(
        "GURU_DAILY_TOKEN_BUDGET",
        DEFAULT_DAILY_TOKEN_BUDGET,
      ),
    },
    systemPrompt: GURU_SYSTEM_PROMPT,
    generate: (input) => provider.generateAnswer(input),
  };

  const turn = await runGuruTurn(ask, deps);

  // Persist the usage/cost log (best-effort — a log failure must not break the learner's answer).
  try {
    await prisma.guruMessage.create({
      data: {
        userId: ask.userId,
        courseId: ctx?.courseId ?? null,
        lessonId: ask.lessonId,
        question: ask.question,
        answer: turn.answer,
        verdict: turn.verdict,
        citations: turn.citations as unknown as Prisma.InputJsonValue,
        promptTokens: turn.promptTokens,
        completionTokens: turn.completionTokens,
        costPaise: turn.costPaise,
      },
    });
  } catch (e) {
    console.warn(
      "[guru] log write failed:",
      e instanceof Error ? e.message : e,
    );
  }

  // Analytics: verdict + whether it cited — NO question/answer text (§1D).
  await track("guru_asked", ask.userId, {
    verdict: turn.verdict,
    cited: turn.citations.length > 0,
    provider: provider.name,
  });

  return turn;
}
