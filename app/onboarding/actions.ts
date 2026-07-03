// Post-purchase onboarding (Ticket 3, Task 5). Collects name, email, goal — skippable.
// Sets onboardedAt. Goal maps to User.goal (SKILL | INCOME | BOTH).
"use server";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { getSupabaseUser } from "../../lib/auth/session";
import { syncUser } from "../../lib/auth/user-sync";

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  goal: z.enum(["SKILL", "INCOME", "BOTH"]),
});

export type OnboardingResult = { ok: true } | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) return null;
  const user = await syncUser(supabaseUser);
  return user.id;
}

export async function saveOnboarding(
  input: z.input<typeof onboardingSchema>,
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in first." };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        goal: parsed.data.goal,
        onboardedAt: new Date(),
      },
    });
    return { ok: true };
  } catch (e) {
    // Unique email collision is the likely failure.
    return {
      ok: false,
      error:
        e instanceof Error
          ? "Could not save (email may already be in use)."
          : "Could not save",
    };
  }
}

export async function skipOnboarding(): Promise<OnboardingResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in first." };
  await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  });
  return { ok: true };
}
