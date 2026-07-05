// GPS-M5 §2.0 Guru engine — shared domain types. PURE (no I/O, no framework).
// Guru is a COURSE COMPANION, not a general chatbot: it answers ONLY from the Course Knowledge Base
// (transcripts primary; notes/glossary enrich when present) and never talks income/earnings (D-29).

/** The five terminal states of a Guru turn (§1B state machine + provider ERROR). */
export type GuruVerdict =
  | "ANSWERED" // cited answer from corpus
  | "REDIRECTED" // out-of-scope → warm redirect to course content
  | "BLOCKED" // D-29 guardrail (income/earnings) → warm refusal
  | "CAPPED" // per-user or global cap hit → honest "thak gaya" state
  | "EMPTY" // lesson/course has no knowledge yet → honest state
  | "ERROR"; // provider failure → warm retry state

/** One retrievable unit of the Course Knowledge Base, already resolved to its lesson. */
export interface KnowledgeChunk {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number; // 1-based within course, for "Lesson N" citations
  kind: "TRANSCRIPT" | "NOTES" | "GLOSSARY";
  text: string;
}

/** A citation surfaced to the learner ("Lesson 3 me dekha tha…"). */
export interface Citation {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
}

/** What the provider is asked to generate (corpus-only; the context IS the retrieved chunks). */
export interface GuruGenerationInput {
  question: string;
  systemPrompt: string;
  context: KnowledgeChunk[]; // top-k retrieved chunks — the ONLY knowledge Guru may use
}

/** What a provider returns for one generation (tokens + cost feed the caps + log). */
export interface GuruGeneration {
  answer: string;
  promptTokens: number;
  completionTokens: number;
  costPaise: number;
}

/** The engine's result for one turn — what the UI renders + what we log. */
export interface GuruTurn {
  verdict: GuruVerdict;
  answer: string;
  citations: Citation[];
  promptTokens: number;
  completionTokens: number;
  costPaise: number;
}
