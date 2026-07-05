// GPS-M5 §2.2 — admin quiz adapter (Register 3). Art 6: agents draft, humans decide — Guru only
// DRAFTS; an admin edits + explicitly PUBLISHES. Every mutation is audited in the same transaction.
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import { getAiProvider } from "../ai/provider";
import { resolveLessonContext, loadCourseKnowledge } from "../ai/knowledge";
import {
  validateQuizForPublish,
  type QuizQuestionSpec,
} from "../../modules/lms/quiz";

export interface AdminQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
}
export interface QuizDraftInput {
  title: string;
  isMandatory: boolean;
  passPercent: number;
  questions: AdminQuestion[];
}

export interface AdminQuizView {
  quizId: string;
  lessonId: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  isMandatory: boolean;
  passPercent: number;
  questions: (AdminQuestion & { order: number })[];
}

export type QuizAdminResult =
  { ok: true; quizId: string } | { ok: false; error: string };

export interface CourseLessonQuiz {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  quiz: AdminQuizView | null;
}

/** Every lesson in the course (ordered) with its quiz state — powers the admin quiz manager. */
export async function getCourseQuizzes(
  courseId: string,
): Promise<CourseLessonQuiz[]> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      title: true,
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          quiz: {
            select: {
              id: true,
              status: true,
              title: true,
              isMandatory: true,
              passPercent: true,
              questions: {
                orderBy: { order: "asc" },
                select: {
                  prompt: true,
                  options: true,
                  correctIndex: true,
                  explanation: true,
                  order: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const out: CourseLessonQuiz[] = [];
  for (const m of modules) {
    for (const l of m.lessons) {
      out.push({
        lessonId: l.id,
        lessonTitle: l.title,
        moduleTitle: m.title,
        quiz: l.quiz
          ? {
              quizId: l.quiz.id,
              lessonId: l.id,
              title: l.quiz.title,
              status: l.quiz.status,
              isMandatory: l.quiz.isMandatory,
              passPercent: l.quiz.passPercent,
              questions: l.quiz.questions.map((q) => ({
                prompt: q.prompt,
                options: q.options as string[],
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                order: q.order,
              })),
            }
          : null,
      });
    }
  }
  return out;
}

/** Full quiz (with answer key) for the admin editor, or null if none exists for the lesson. */
export async function getLessonQuizForAdmin(
  lessonId: string,
): Promise<AdminQuizView | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      status: true,
      title: true,
      isMandatory: true,
      passPercent: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          prompt: true,
          options: true,
          correctIndex: true,
          explanation: true,
          order: true,
        },
      },
    },
  });
  if (!quiz) return null;
  return {
    quizId: quiz.id,
    lessonId,
    title: quiz.title,
    status: quiz.status,
    isMandatory: quiz.isMandatory,
    passPercent: quiz.passPercent,
    questions: quiz.questions.map((q) => ({
      prompt: q.prompt,
      options: q.options as string[],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      order: q.order,
    })),
  };
}

function questionRows(quizId: string, questions: AdminQuestion[]) {
  return questions.map((q, i) => ({
    quizId,
    prompt: q.prompt.trim(),
    options: q.options as unknown as Prisma.InputJsonValue,
    correctIndex: q.correctIndex,
    explanation: q.explanation?.trim() || null,
    order: i,
  }));
}

/** Create/replace the lesson's DRAFT questions from a save. Does NOT publish. Audited. */
export async function saveQuizDraft(
  actor: AdminIdentity,
  lessonId: string,
  input: QuizDraftInput,
): Promise<QuizAdminResult> {
  if (!input.title.trim())
    return { ok: false, error: "Give the quiz a title." };
  if (input.passPercent < 1 || input.passPercent > 100)
    return { ok: false, error: "Pass % must be between 1 and 100." };
  try {
    const quizId = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.upsert({
        where: { lessonId },
        update: {
          title: input.title.trim(),
          isMandatory: input.isMandatory,
          passPercent: input.passPercent,
        },
        create: {
          lessonId,
          title: input.title.trim(),
          isMandatory: input.isMandatory,
          passPercent: input.passPercent,
        },
        select: { id: true },
      });
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      if (input.questions.length > 0)
        await tx.quizQuestion.createMany({
          data: questionRows(quiz.id, input.questions),
        });
      await recordAdminAction(tx, {
        actor,
        action: "QUIZ_SAVED",
        entity: "Quiz",
        entityId: quiz.id,
        meta: {
          lessonId,
          questionCount: input.questions.length,
          mandatory: input.isMandatory,
        },
      });
      return quiz.id;
    });
    return { ok: true, quizId };
  } catch {
    return { ok: false, error: "Could not save the quiz." };
  }
}

/** Guru-assisted DRAFT (agents draft, humans decide) — corpus-grounded, replaces existing questions,
 *  leaves status DRAFT. Audited. Returns the draft questions for the editor to load + edit. */
export async function generateQuizDraft(
  actor: AdminIdentity,
  lessonId: string,
  count = 3,
): Promise<
  { ok: true; questions: QuizQuestionSpec[] } | { ok: false; error: string }
> {
  const ctx = await resolveLessonContext(lessonId);
  if (!ctx) return { ok: false, error: "Lesson not found." };
  const chunks = (await loadCourseKnowledge(ctx.courseId)).filter(
    (c) => c.lessonId === lessonId,
  );
  if (chunks.length === 0)
    return {
      ok: false,
      error: "This lesson has no transcript yet — add notes before generating.",
    };

  let draft: QuizQuestionSpec[];
  try {
    draft = await getAiProvider().draftQuizQuestions({
      lessonTitle: ctx.lessonTitle,
      context: chunks,
      count,
    });
  } catch (e) {
    console.warn(
      "[quiz] draft generation failed:",
      e instanceof Error ? e.message : e,
    );
    return {
      ok: false,
      error: "Guru could not draft this quiz — try again or author manually.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.upsert({
        where: { lessonId },
        update: { status: "DRAFT" },
        create: {
          lessonId,
          title: `${ctx.lessonTitle} — checkpoint`,
          status: "DRAFT",
        },
        select: { id: true },
      });
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      await tx.quizQuestion.createMany({
        data: draft.map((q, i) => ({
          quizId: quiz.id,
          prompt: q.prompt,
          options: q.options as unknown as Prisma.InputJsonValue,
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
          order: i,
        })),
      });
      await recordAdminAction(tx, {
        actor,
        action: "QUIZ_GENERATED",
        entity: "Quiz",
        entityId: quiz.id,
        meta: { lessonId, count: draft.length, provider: getAiProvider().name },
      });
    });
  } catch {
    return { ok: false, error: "Could not save the generated draft." };
  }
  return { ok: true, questions: draft };
}

/** Validate + PUBLISH the lesson's quiz (human decision). Audited. */
export async function publishQuiz(
  actor: AdminIdentity,
  lessonId: string,
): Promise<QuizAdminResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      questions: {
        orderBy: { order: "asc" },
        select: { prompt: true, options: true, correctIndex: true },
      },
    },
  });
  if (!quiz)
    return { ok: false, error: "No quiz to publish — save a draft first." };

  const specs: QuizQuestionSpec[] = quiz.questions.map((q) => ({
    prompt: q.prompt,
    options: q.options as string[],
    correctIndex: q.correctIndex,
  }));
  const valid = validateQuizForPublish(specs);
  if (!valid.ok) return { ok: false, error: valid.error };

  await prisma.$transaction(async (tx) => {
    // publishedAt anchors the grandfather rule — gates only completions at/after this moment.
    await tx.quiz.update({
      where: { id: quiz.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await recordAdminAction(tx, {
      actor,
      action: "QUIZ_PUBLISHED",
      entity: "Quiz",
      entityId: quiz.id,
      meta: { lessonId, questionCount: specs.length },
    });
  });
  return { ok: true, quizId: quiz.id };
}

/** Revert a quiz to DRAFT (removes it from the certificate gate + learner checkpoints). Audited. */
export async function unpublishQuiz(
  actor: AdminIdentity,
  lessonId: string,
): Promise<QuizAdminResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: { id: true },
  });
  if (!quiz) return { ok: false, error: "No quiz found." };
  await prisma.$transaction(async (tx) => {
    await tx.quiz.update({
      where: { id: quiz.id },
      data: { status: "DRAFT", publishedAt: null },
    });
    await recordAdminAction(tx, {
      actor,
      action: "QUIZ_UNPUBLISHED",
      entity: "Quiz",
      entityId: quiz.id,
      meta: { lessonId },
    });
  });
  return { ok: true, quizId: quiz.id };
}
