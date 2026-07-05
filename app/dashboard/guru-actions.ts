// GPS-M5 §2.1 — Guru server action. Thin boundary: auth + Zod, then delegate to the parked Tier-A
// engine (lib/ai/guru → askGuru). Access + corpus-only + D-29 + caps are all enforced server-side in
// the engine; the client is never trusted. Returns only what the UI renders (verdict/answer/citations).
"use server";
import { getCurrentUser } from "../../lib/auth/session";
import { askGuru } from "../../lib/ai/guru";
import { askGuruSchema } from "../../modules/ai/guru/schemas";
import type { GuruVerdict, Citation } from "../../modules/ai/guru/types";

export type AskGuruResult =
  | { ok: true; verdict: GuruVerdict; answer: string; citations: Citation[] }
  | { ok: false; error: string };

export async function askGuruAction(input: {
  lessonId: string;
  question: string;
}): Promise<AskGuruResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to ask Guru." };

  const parsed = askGuruSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid question.",
    };

  try {
    const turn = await askGuru({
      userId: user.id,
      lessonId: parsed.data.lessonId,
      question: parsed.data.question,
    });
    return {
      ok: true,
      verdict: turn.verdict,
      answer: turn.answer,
      citations: turn.citations,
    };
  } catch (e) {
    console.warn("[guru] action failed:", e instanceof Error ? e.message : e);
    return {
      ok: false,
      error: "Guru abhi ruk gaya — thodi der baad try karo.",
    };
  }
}
