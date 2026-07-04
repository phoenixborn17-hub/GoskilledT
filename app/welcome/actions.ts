// Welcome-moment server actions (DR-030 §4). The one-time post-registration screen. Completing OR
// skipping stamps User.welcomeSeenAt (nullable ts — Tier A) so it never shows again. No mandatory
// gate: "skip" is a first-class outcome. Name is optional and only set if we don't already have one.
"use server";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/auth/session";
import { getLesson0Status } from "../../lib/lms/getting-started";
import { track } from "../../lib/analytics/track";

export type WelcomeResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

const schema = z.object({
  intent: z.enum(["start", "skip"]),
  name: z.string().trim().max(80).optional(),
});

export async function completeWelcome(
  input: z.input<typeof schema>,
): Promise<WelcomeResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, welcomeSeenAt: true },
  });

  const name = parsed.data.name?.trim();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Stamp once — never overwrite an earlier completion.
      welcomeSeenAt: current?.welcomeSeenAt ?? new Date(),
      ...(name && !current?.name ? { name } : {}),
    },
  });

  if (parsed.data.intent === "skip") {
    await track("welcome_skipped", user.id, {});
    return { ok: true, redirectTo: "/dashboard" };
  }

  // Start Lesson 0 in the real LMS player (free preview — always accessible).
  const lesson0 = await getLesson0Status(user.id);
  const redirectTo = lesson0.lessonId
    ? `/dashboard/learn/${lesson0.courseSlug}?lesson=${lesson0.lessonId}`
    : "/dashboard";
  return { ok: true, redirectTo };
}
