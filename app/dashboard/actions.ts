// Dashboard server actions (Ticket 4 · GPS-M2 §2.5). Access is enforced server-side — the client
// is never trusted for completion, profile writes, or auth.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { getCurrentUser } from "../../lib/auth/session";
import { completeLesson } from "../../lib/lms/queries";
import { issueCertificateIfEligible } from "../../lib/lms/certificate";
import type { ProgressSummary } from "../../modules/lms/progress";
import { track } from "../../lib/analytics/track";

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Profile edit (§2.5): name/email/goal only. Phone is auth identity (read-only). Zod-validated;
// the client is never trusted. Email is unique — a collision is reported, not thrown.
const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  goal: z.enum(["SKILL", "INCOME", "BOTH"]),
});

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  input: z.input<typeof profileSchema>,
): Promise<UpdateProfileResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        goal: parsed.data.goal,
      },
    });
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not save (email may already be in use).",
    };
  }
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
    const { courseId, progress } = await completeLesson(
      user.id,
      input.lessonId,
    );
    await track("lesson_complete", user.id, {
      course_slug: input.courseSlug,
      lesson_id: input.lessonId,
      completed: progress.completed,
      total: progress.total,
    });
    // Certificate issuance (§2.6): fires once when the course hits 100%. Best-effort + idempotent —
    // an issuance hiccup must never fail the learner's lesson completion.
    if (progress.percent === 100) {
      try {
        await issueCertificateIfEligible(user.id, courseId);
      } catch (e) {
        console.warn(
          "[certificate] issuance failed:",
          e instanceof Error ? e.message : e,
        );
      }
    }
    revalidatePath(`/dashboard/learn/${input.courseSlug}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/progress");
    return { ok: true, progress };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update progress",
    };
  }
}
