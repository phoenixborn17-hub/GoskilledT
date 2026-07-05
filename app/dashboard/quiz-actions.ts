// GPS-M5 §2.2 — learner quiz server action. Thin boundary: auth + Zod → submitQuizAttempt (which
// grades server-side, records the attempt, and may open the certificate gate). The answer key is
// only ever returned AFTER grading.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/auth/session";
import { submitQuizAttempt } from "../../lib/lms/quiz";
import type { GradedAttempt } from "../../modules/lms/quiz";

const schema = z.object({
  lessonId: z.string().trim().min(1),
  courseSlug: z.string().trim().min(1),
  answers: z.array(z.number().int().min(-1).max(5)).min(1).max(50),
});

export type SubmitQuizActionResult =
  { ok: true; graded: GradedAttempt } | { ok: false; error: string };

export async function submitQuizAttemptAction(
  input: z.input<typeof schema>,
): Promise<SubmitQuizActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };

  const res = await submitQuizAttempt(
    user.id,
    parsed.data.lessonId,
    parsed.data.answers,
  );
  if (!res.ok) return res;

  if (res.graded.passed) {
    // A pass can open the certificate gate + advance progress surfaces.
    revalidatePath(`/dashboard/learn/${parsed.data.courseSlug}`);
    revalidatePath("/dashboard/progress");
  }
  return { ok: true, graded: res.graded };
}
