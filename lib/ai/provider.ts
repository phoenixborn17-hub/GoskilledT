// GPS-M5 §2.0 — Guru AI provider adapter. Mock and live expose the SAME interface, so switching is
// AI_PROVIDER=mock|live + the Anthropic key. Mock = deterministic canned answers (dev/tests); live =
// Anthropic Messages API. Corpus-only is enforced by the ENGINE (retrieval + guardrail), so this
// adapter is thin: it only turns {question, systemPrompt, context} into an answer + token/cost usage.
import Anthropic from "@anthropic-ai/sdk";
import {
  aiProviderName,
  softWarnProductionAi,
  type AiProviderName,
} from "../config/providers";
import { requireEnv } from "../env";
import { renderContext } from "../../modules/ai/guru/prompt";
import type {
  GuruGeneration,
  GuruGenerationInput,
} from "../../modules/ai/guru/types";
import type { QuizQuestionSpec } from "../../modules/lms/quiz";

export interface QuizDraftInput {
  lessonTitle: string;
  context: import("../../modules/ai/guru/types").KnowledgeChunk[];
  count: number;
}

export interface AiProvider {
  readonly name: AiProviderName;
  generateAnswer(input: GuruGenerationInput): Promise<GuruGeneration>;
  /**
   * Guru-assisted quiz DRAFT (Art 6: agents draft, humans decide). Output is always a starting point
   * an admin edits + approves before publish — never auto-published. Corpus-grounded.
   */
  draftQuizQuestions(input: QuizDraftInput): Promise<QuizQuestionSpec[]>;
}

/**
 * Guru's model + budget knobs (LC #36) — the founder's cost decision, configurable via env and never
 * silently baked in. Default is a cost-appropriate tier for a high-volume course tutor answering short
 * doubts from a small corpus; set GURU_MODEL to override (e.g. a larger model) pre-launch.
 */
export function guruModel(): string {
  return process.env.GURU_MODEL || "claude-haiku-4-5";
}
const MAX_ANSWER_TOKENS = 600; // short, focused Hinglish answers — one doubt, one reply

// Rough USD/1M-token pricing for the internal cost log (observability only — NOT money moved, so an
// approximation is fine). Keyed by model prefix; falls back to Haiku-tier. INR conversion is a coarse
// constant purely so the admin usage card can show ₹ — never used for billing.
const PRICING_USD_PER_M: Record<string, { in: number; out: number }> = {
  "claude-haiku": { in: 1, out: 5 },
  "claude-sonnet": { in: 3, out: 15 },
  "claude-opus": { in: 5, out: 25 },
  "claude-fable": { in: 10, out: 50 },
};
const USD_TO_PAISE = 8300; // ~₹83/USD, coarse — internal cost display only

export function estimateCostPaise(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const key = Object.keys(PRICING_USD_PER_M).find((p) => model.startsWith(p));
  const price =
    (key && PRICING_USD_PER_M[key]) || PRICING_USD_PER_M["claude-haiku"];
  const usd =
    (promptTokens / 1e6) * price.in + (completionTokens / 1e6) * price.out;
  return Math.round(usd * USD_TO_PAISE);
}

// ── Mock provider ──────────────────────────────────────────────────────────────────────────────
// Deterministic canned Hinglish answer that CITES the top retrieved lesson, so tests can assert
// citation presence + verdict without a network call. Never invents content beyond the corpus.
function deterministicTokens(text: string): number {
  // Stable, cheap proxy for token count (word count) — deterministic across runs.
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export const mockAiProvider: AiProvider = {
  name: "mock",
  async generateAnswer(input: GuruGenerationInput): Promise<GuruGeneration> {
    const top = input.context[0];
    const cite = top ? `Lesson ${top.lessonOrder} me dekha tha — ` : "";
    const snippet = top ? top.text.split(/(?<=[.!?।])\s+/)[0] : "";
    const answer =
      `${cite}${snippet} ` +
      `(Ye is course ke notes se hai.) Aur koi doubt ho to pooch lo!`;
    const promptTokens = deterministicTokens(
      input.systemPrompt + renderContext(input.context) + input.question,
    );
    const completionTokens = deterministicTokens(answer);
    return { answer, promptTokens, completionTokens, costPaise: 0 };
  },
  async draftQuizQuestions({ lessonTitle, context, count }) {
    // Deterministic, clearly-[DRAFT] questions — the admin replaces them before publish. In prod the
    // live provider drafts real ones; in dev these are honest placeholders (never auto-published).
    const n = Math.max(1, Math.min(count, 5));
    return Array.from({ length: n }, (_, i) => {
      const topic =
        context[i % Math.max(1, context.length)]?.lessonTitle ?? lessonTitle;
      return {
        prompt: `[DRAFT] ${lessonTitle} — question ${i + 1}: is lesson ka ek concept. (Admin: edit karein.)`,
        options: ["Option A [edit]", "Option B [edit]", "Option C [edit]"],
        correctIndex: 0,
        explanation: `[DRAFT] Sahi jawab yahan samjhayein (${topic}).`,
      };
    });
  },
};

// ── Live provider (Anthropic Messages API via the official SDK) ──────────────────────────────────
let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client)
    client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

export const liveAiProvider: AiProvider = {
  name: "live",
  async generateAnswer(input: GuruGenerationInput): Promise<GuruGeneration> {
    const model = guruModel();
    // Corpus goes in the system prompt (authoritative context); the question is the user turn.
    // No thinking: a short course-doubt answer isn't a reasoning task — keeps Guru fast + cheap.
    const res = await anthropic().messages.create({
      model,
      max_tokens: MAX_ANSWER_TOKENS,
      system: `${input.systemPrompt}\n\nCOURSE NOTES (inhi se jawab do):\n${renderContext(input.context)}`,
      messages: [{ role: "user", content: input.question }],
    });

    // Guard the refusal path (defence-in-depth; classifiers can decline on some models).
    if (res.stop_reason === "refusal") {
      throw new Error("guru: provider refused the request");
    }
    const answer = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!answer) throw new Error("guru: empty answer from provider");

    const promptTokens = res.usage.input_tokens ?? 0;
    const completionTokens = res.usage.output_tokens ?? 0;
    return {
      answer,
      promptTokens,
      completionTokens,
      costPaise: estimateCostPaise(model, promptTokens, completionTokens),
    };
  },
  async draftQuizQuestions({ lessonTitle, context, count }) {
    const res = await anthropic().messages.create({
      model: guruModel(),
      max_tokens: 1500,
      system:
        "You draft multiple-choice quiz questions ONLY from the given course notes — never from outside knowledge. " +
        "Reply with STRICT JSON only: an array of {prompt, options (2-4 strings), correctIndex (0-based), explanation}. " +
        "Prompts + explanations in warm Hinglish. No income/earnings content.",
      messages: [
        {
          role: "user",
          content: `Lesson: ${lessonTitle}\n\nNOTES:\n${renderContext(context)}\n\nDraft ${count} MCQs as a JSON array. JSON only, no prose.`,
        },
      ],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("guru: quiz draft was not valid JSON");
    const raw = JSON.parse(match[0]) as Array<Partial<QuizQuestionSpec>>;
    return raw.slice(0, count).map((q) => ({
      prompt: String(q.prompt ?? "").trim(),
      options: (Array.isArray(q.options) ? q.options : []).map((o) =>
        String(o),
      ),
      correctIndex: Number.isInteger(q.correctIndex)
        ? (q.correctIndex as number)
        : 0,
      explanation: q.explanation ? String(q.explanation) : null,
    }));
  },
};

export function getAiProvider(): AiProvider {
  softWarnProductionAi();
  return aiProviderName() === "live" ? liveAiProvider : mockAiProvider;
}
