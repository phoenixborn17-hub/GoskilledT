// GPS-M5 §2.0 — boundary validation for a Guru ask (Golden Rule 4: Zod at every boundary).
import { z } from "zod";

export const askGuruSchema = z.object({
  lessonId: z.string().trim().min(1, "lessonId is required"),
  question: z
    .string()
    .trim()
    .min(2, "Thoda aur likho — Guru ko samajhne ke liye.")
    .max(500, "Sawaal thoda chhota rakho (max 500 characters)."),
});

export type AskGuruInput = z.infer<typeof askGuruSchema>;
