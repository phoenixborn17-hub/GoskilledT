// GPS-M5 §2.2 — admin quiz server actions (Register 3). Each: getAdminUser → audited adapter →
// revalidate. Art 6: generate DRAFTS only; publish is an explicit human decision.
"use server";
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

export async function saveQuizDraftAction(
  courseId: string,
  lessonId: string,
  input: QuizDraftInput,
): Promise<Res> {
  const a = await getAdminUser();
  if (!a) return { ok: false, error: "Not authorized" };
  const res = await saveQuizDraft(a, lessonId, input);
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
