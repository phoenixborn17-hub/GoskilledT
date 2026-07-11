// GPS-M5 §2.2 — admin quiz server actions (Register 3). Each: getAdminUser → audited adapter →
// revalidate. Art 6: generate DRAFTS only; publish is an explicit human decision.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  saveQuizDraft,
  generateQuizDraft,
  publishQuiz,
  unpublishQuiz,
  type QuizDraftInput,
} from "../../../lib/admin/quiz";
import type { QuizQuestionSpec } from "../../../modules/lms/quiz";

type Res = { ok: true } | { ok: false; error: string };

// AD-4: validate the structured quiz-draft payload at the boundary. Without this, a malformed
// correctIndex (out of range/negative) or empty options list is persisted to a DRAFT and only caught
// at publish time. Enforce the shape here so bad data never lands in the DB.
const quizDraftSchema = z.object({
  title: z.string().trim().min(1, "Give the quiz a title.").max(200),
  isMandatory: z.boolean(),
  passPercent: z.number().int().min(1).max(100),
  questions: z
    .array(
      z
        .object({
          prompt: z.string().trim().min(1, "Each question needs a prompt."),
          options: z
            .array(z.string().trim().min(1))
            .min(2, "Each question needs at least 2 options."),
          correctIndex: z.number().int().min(0),
          explanation: z.string().trim().nullable().optional(),
        })
        .refine((q) => q.correctIndex < q.options.length, {
          message: "correctIndex must point at one of the options.",
          path: ["correctIndex"],
        }),
    )
    .min(1, "Add at least one question."),
});

export async function saveQuizDraftAction(
  courseId: string,
  lessonId: string,
  input: QuizDraftInput,
): Promise<Res> {
  const a = await getAdminUser();
  if (!a) return { ok: false, error: "Not authorized" };
  const parsed = quizDraftSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid quiz draft.",
    };
  const res = await saveQuizDraft(a, lessonId, parsed.data);
  if (res.ok) revalidatePath(`/admin/catalog/${courseId}`);
  return res.ok ? { ok: true } : res;
}

export async function generateQuizDraftAction(
  courseId: string,
  lessonId: string,
): Promise<
  { ok: true; questions: QuizQuestionSpec[] } | { ok: false; error: string }
> {
  const a = await getAdminUser();
  if (!a) return { ok: false, error: "Not authorized" };
  const res = await generateQuizDraft(a, lessonId);
  if (res.ok) revalidatePath(`/admin/catalog/${courseId}`);
  return res;
}

export async function publishQuizAction(
  courseId: string,
  lessonId: string,
): Promise<Res> {
  const a = await getAdminUser();
  if (!a) return { ok: false, error: "Not authorized" };
  const res = await publishQuiz(a, lessonId);
  if (res.ok) revalidatePath(`/admin/catalog/${courseId}`);
  return res.ok ? { ok: true } : res;
}

export async function unpublishQuizAction(
  courseId: string,
  lessonId: string,
): Promise<Res> {
  const a = await getAdminUser();
  if (!a) return { ok: false, error: "Not authorized" };
  const res = await unpublishQuiz(a, lessonId);
  if (res.ok) revalidatePath(`/admin/catalog/${courseId}`);
  return res.ok ? { ok: true } : res;
}
