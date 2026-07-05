// GPS-M5 §2.2 — learner quiz adapter (checkpoint). Thin over the pure grader (modules/lms/quiz).
// Access is server-enforced (enrolled + PUBLISHED only); the answer key never reaches the client
// until an attempt is graded. Passing a mandatory quiz may complete the certificate gate → best-effort
// issuance (idempotent + immutable — never revokes, mirrors the lesson-completion path).
import { prisma } from "../prisma";
import { isEnrolled } from "./queries";
import { issueCertificateIfEligible } from "./certificate";
import { maybeSendCertificateEmail } from "../email/notify";
import { track } from "../analytics/track";
import {
  gradeAttempt,
  type GradedAttempt,
  type QuizQuestionSpec,
} from "../../modules/lms/quiz";

export interface LearnerQuizView {
  quizId: string;
  title: string;
  passPercent: number;
  isMandatory: boolean;
  alreadyPassed: boolean;
  // Answer key intentionally omitted — the learner never receives correctIndex before grading.
  questions: { id: string; prompt: string; options: string[]; order: number }[];
}

/** The PUBLISHED checkpoint for a lesson (or null). Answer-key stripped; includes prior-pass state. */
export async function getPublishedQuizForLearner(
  userId: string,
  lessonId: string,
): Promise<LearnerQuizView | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      status: true,
      title: true,
      passPercent: true,
      isMandatory: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, options: true, order: true },
      },
    },
  });
  if (!quiz || quiz.status !== "PUBLISHED") return null;

  const priorPass = await prisma.quizAttempt.findFirst({
    where: { userId, quizId: quiz.id, passed: true },
    select: { id: true },
  });

  return {
    quizId: quiz.id,
    title: quiz.title,
    passPercent: quiz.passPercent,
    isMandatory: quiz.isMandatory,
    alreadyPassed: !!priorPass,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options as string[],
      order: q.order,
    })),
  };
}

export type SubmitQuizResult =
  { ok: true; graded: GradedAttempt } | { ok: false; error: string };

/**
 * Grade + record one attempt for the lesson's PUBLISHED quiz. Unlimited retries. Returns the full
 * graded result (answer key + explanations revealed AFTER submission). On a pass, emits the event and
 * tries certificate issuance (the mandatory gate may now be satisfied).
 */
export async function submitQuizAttempt(
  userId: string,
  lessonId: string,
  answers: number[],
): Promise<SubmitQuizResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      status: true,
      passPercent: true,
      lesson: { select: { module: { select: { courseId: true } } } },
      questions: {
        orderBy: { order: "asc" },
        select: {
          prompt: true,
          options: true,
          correctIndex: true,
          explanation: true,
        },
      },
    },
  });
  if (!quiz || quiz.status !== "PUBLISHED")
    return { ok: false, error: "This quiz isn't available." };

  const courseId = quiz.lesson.module.courseId;
  if (!(await isEnrolled(userId, courseId)))
    return { ok: false, error: "Enroll in this course to take the quiz." };

  const specs: QuizQuestionSpec[] = quiz.questions.map((q) => ({
    prompt: q.prompt,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
  const graded = gradeAttempt(specs, answers, quiz.passPercent);

  await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      answers: answers as unknown as number[],
    },
  });

  if (graded.passed) {
    await track("quiz_passed", userId, {
      score_percent: graded.scorePercent,
      mandatory_gate: true,
    });
    // A passing mandatory quiz may complete the certificate gate. Best-effort + idempotent.
    try {
      await issueCertificateIfEligible(userId, courseId);
      await maybeSendCertificateEmail(userId, courseId); // §2.4 cert-ready email (deduped)
    } catch (e) {
      console.warn(
        "[quiz] cert issuance after pass failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { ok: true, graded };
}
