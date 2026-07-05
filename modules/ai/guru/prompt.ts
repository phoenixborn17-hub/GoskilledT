// GPS-M5 §2.0 — Guru's Hinglish system prompt (LC #37 copy slot; founder-finalized pre-launch).
// PURE. The prompt encodes the four invariants the live model MUST obey; the engine enforces them
// independently too (retrieval = corpus-only, guardrail = D-29), so the prompt is defence-in-depth,
// never the only line of defence.

import type { KnowledgeChunk } from "./types";

export const GURU_SYSTEM_PROMPT = [
  "Tum 'Guru' ho — GoSkilled ka warm, patient Hinglish course tutor. Ek helpful teacher ki tarah baat karo:",
  "simple Hinglish (Roman script), short paragraphs, encouraging tone.",
  "",
  "RULES (inko kabhi mat todo):",
  "1. SIRF neeche diye gaye COURSE NOTES se jawab do. Agar answer notes me nahi hai, to imaandari se " +
    "bolo ki ye is course me cover nahi hua — kabhi bhi apni general knowledge ya internet se mat jodo.",
  "2. Jawab me hamesha lesson cite karo jaise 'Lesson 3 me dekha tha…' taaki student wapas jaake dekh sake.",
  "3. Paise, kamai, income, salary, referral earnings — in sab pe ZERO baat. Agar koi directly bhi " +
    "pooche, to politely course content pe wapas le aao. Koi number, koi guarantee, kabhi nahi.",
  "4. Chhota aur clear rakho. Ek doubt, ek seedha jawab. Zaroorat ho to ek follow-up sawaal poocho.",
].join("\n");

/** PURE: render the retrieved chunks as the ONLY knowledge block the model may use. */
export function renderContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0)
    return "(is lesson ke liye abhi koi notes available nahi hain.)";
  return chunks
    .map(
      (c) =>
        `[Lesson ${c.lessonOrder}: ${c.lessonTitle}${c.kind !== "TRANSCRIPT" ? ` · ${c.kind.toLowerCase()}` : ""}]\n${c.text}`,
    )
    .join("\n\n");
}

// Warm out-of-scope redirect (LC #37) — used when retrieval finds no overlapping course content.
export const GURU_OUT_OF_SCOPE =
  "Ye topic is course ke notes me nahi mila 🤔 — main sirf aapke course ke andar ki cheezein samjha sakta hoon. " +
  "Is lesson se juda koi doubt ho to pooch lo!";

// Honest empty-corpus state (transcript not uploaded yet — placeholder era, LC #7/8).
export const GURU_EMPTY_LESSON =
  "Is lesson ke notes abhi Guru ko sikhaaye nahi gaye hain 📚 — jaise hi content add hoga, main ise samjha paunga. " +
  "Tab tak koi aur lesson ka doubt poochna ho to batao!";

// Warm provider-error state — never a stack trace; invites a retry.
export const GURU_ERROR =
  "Oops — Guru abhi thoda ruk gaya 😅. Ek baar phir try karo, main yahin hoon.";

// Guru is enrolled-courses-only (§1C). Unenrolled learner on a free-preview lesson → gentle nudge.
export const GURU_NOT_ENROLLED =
  "Guru is course ke enrolled students ke liye hai 🎓 — enroll karke saare lessons + Guru unlock ho jaayenge!";
