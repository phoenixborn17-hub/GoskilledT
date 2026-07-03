// Dashboard server actions (Ticket 4). Access is enforced server-side — the client is never
// trusted for completion or auth.
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getCurrentUser } from "../../lib/auth/session";
import { completeLesson } from "../../lib/lms/queries";
import type { ProgressSummary } from "../../modules/lms/progress";
import { track } from "../../lib/analytics/track";

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type CompleteLessonResult =
  { ok: true; progress: ProgressSummary } | { ok: false; error: string };

export async function completeLessonAction(input: {
  courseSlug: string;
  lessonId: string;
}): Promise<CompleteLessonResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };
  try {
    const { progress } = await completeLesson(user.id, input.lessonId);
    await track("lesson_complete", user.id, {
      course_slug: input.courseSlug,
      lesson_id: input.lessonId,
      completed: progress.completed,
      total: progress.total,
    });
    revalidatePath(`/dashboard/learn/${input.courseSlug}`);
    revalidatePath("/dashboard");
    return { ok: true, progress };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update progress",
    };
  }
}
