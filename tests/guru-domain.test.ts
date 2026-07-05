// GPS-M5 §2.0 Guru engine — pure domain tests (no DB, no network). Covers the four spec-required
// behaviours: D-29 guardrail (income refusal), out-of-scope redirect, cost caps, citation presence —
// plus the full §1B state machine via the dependency-injected engine, and the mock provider.
import { describe, it, expect } from "vitest";
import {
  hasIncomeIntent,
  GURU_INCOME_REDIRECT,
} from "../modules/ai/guru/guardrail";
import { chunkText, retrieve } from "../modules/ai/guru/retrieval";
import { decideCap, DEFAULT_DAILY_MSG_CAP } from "../modules/ai/guru/caps";
import { runGuruTurn, type GuruDeps } from "../modules/ai/guru/engine";
import { mockAiProvider } from "../lib/ai/provider";
import type { KnowledgeChunk, GuruGeneration } from "../modules/ai/guru/types";

// ── D-29 guardrail ────────────────────────────────────────────────────────────────────────────
describe("guardrail: hasIncomeIntent (D-29)", () => {
  it("blocks direct earning questions (Hinglish + English)", () => {
    for (const q of [
      "isse main kitna kamaa sakta hoon?",
      "kitna kamaunga ise complete karke",
      "how much can I earn from this course",
      "how much money will I make",
      "refer and earn kaise kaam karta hai",
      "meri salary kitni hogi",
      "monthly income kitna milega",
      "referral commission kaise milta hai",
    ]) {
      expect(hasIncomeIntent(q), q).toBe(true);
    }
  });

  it("allows legitimate course-content questions (no false positives)", () => {
    for (const q of [
      "system prompt kya hota hai?",
      "is lesson me revenue model ka concept samjhao",
      "digital marketing me funnel kaise banate hain",
      "profit margin ka matlab kya hai",
      "ye topic samajh nahi aaya, phir se batao",
    ]) {
      expect(hasIncomeIntent(q), q).toBe(false);
    }
  });
});

// Fable Tier-A condition 1 — numeric + period hardening.
describe("guardrail: numeric + period hardening (Fable condition 1)", () => {
  it("blocks a currency amount asked as a per-period rate", () => {
    expect(hasIncomeIntent("₹50000 per month possible hai kya?")).toBe(true);
  });
  it("blocks a scaled amount + period + income term", () => {
    expect(hasIncomeIntent("50k monthly income ho sakta hai?")).toBe(true);
  });
  it("blocks a period + how-much + money phrasing (Hinglish)", () => {
    expect(hasIncomeIntent("har mahine kitna paisa banega")).toBe(true);
  });
  it("does NOT false-positive on a currency amount used as course content", () => {
    // A finance/stock lesson legitimately references a price — no earn verb, period, or how-much.
    expect(
      hasIncomeIntent("is stock ki price ₹500 hai, ye kaise change hoti hai?"),
    ).toBe(false);
  });
});

// ── Retrieval (corpus-only, out-of-scope detection) ─────────────────────────────────────────────
const chunkOf = (
  lessonOrder: number,
  lessonTitle: string,
  text: string,
): KnowledgeChunk[] =>
  chunkText(text, {
    lessonId: `l${lessonOrder}`,
    lessonTitle,
    lessonOrder,
    kind: "TRANSCRIPT",
  });

describe("retrieval", () => {
  const corpus = [
    ...chunkOf(
      1,
      "Welcome",
      "Is course me prompt engineering aur AI tools sikhenge. Prompt likhna aata hai.",
    ),
    ...chunkOf(
      2,
      "Core concepts",
      "System prompt model ko context deta hai. Temperature output ko control karta hai.",
    ),
  ];

  it("chunks non-empty text and drops empty", () => {
    expect(
      chunkText("  ", {
        lessonId: "x",
        lessonTitle: "x",
        lessonOrder: 1,
        kind: "TRANSCRIPT",
      }),
    ).toHaveLength(0);
    expect(chunkOf(1, "t", "Ek. Do. Teen.").length).toBeGreaterThan(0);
  });

  it("retrieves the overlapping lesson and cites its order", () => {
    const r = retrieve("system prompt kya karta hai", corpus, { topK: 2 });
    expect(r.empty).toBe(false);
    expect(r.outOfScope).toBe(false);
    expect(r.hits[0].chunk.lessonOrder).toBe(2); // "system prompt" is in Lesson 2
  });

  it("flags out-of-scope when nothing overlaps the corpus", () => {
    const r = retrieve("chess me castling kaise karte hain", corpus);
    expect(r.outOfScope).toBe(true);
    expect(r.hits).toHaveLength(0);
  });

  it("flags empty when the corpus has no chunks", () => {
    const r = retrieve("anything", []);
    expect(r.empty).toBe(true);
  });
});

// ── Cost caps ────────────────────────────────────────────────────────────────────────────────
describe("caps: decideCap", () => {
  const limits = { dailyMsgCap: 5, dailyTokenBudget: 1000 };
  it("not capped below both limits", () => {
    expect(
      decideCap({ userMsgsToday: 2, globalTokensToday: 100, ...limits }).capped,
    ).toBe(false);
  });
  it("caps on per-user daily message limit first", () => {
    const d = decideCap({
      userMsgsToday: 5,
      globalTokensToday: 100,
      ...limits,
    });
    expect(d).toEqual({ capped: true, reason: "user-daily" });
  });
  it("caps on global token budget", () => {
    const d = decideCap({
      userMsgsToday: 1,
      globalTokensToday: 1000,
      ...limits,
    });
    expect(d).toEqual({ capped: true, reason: "global-budget" });
  });
  it("has sane defaults", () => {
    expect(DEFAULT_DAILY_MSG_CAP).toBeGreaterThan(0);
  });
});

// ── Mock provider (citation presence, determinism) ─────────────────────────────────────────────
describe("mock provider", () => {
  it("cites the top lesson and is deterministic", async () => {
    const ctx = chunkOf(
      3,
      "Core concepts",
      "System prompt model ko context deta hai.",
    );
    const input = {
      question: "system prompt?",
      systemPrompt: "sys",
      context: ctx,
    };
    const a = await mockAiProvider.generateAnswer(input);
    const b = await mockAiProvider.generateAnswer(input);
    expect(a.answer).toContain("Lesson 3");
    expect(a).toEqual(b); // deterministic
    expect(a.completionTokens).toBeGreaterThan(0);
  });
});

// ── Engine state machine (dependency-injected — no DB/network) ──────────────────────────────────
function deps(
  over: Partial<GuruDeps> & { generateSpy?: () => void } = {},
): GuruDeps {
  const knowledge = chunkOf(
    2,
    "Core concepts",
    "System prompt model ko context deta hai. Temperature output control karta hai.",
  );
  const gen: GuruGeneration = {
    answer: "Lesson 2 me dekha tha — system prompt context deta hai.",
    promptTokens: 40,
    completionTokens: 12,
    costPaise: 1,
  };
  return {
    resolveContext: async () => ({
      courseId: "c1",
      lessonId: "l2",
      lessonTitle: "Core concepts",
      lessonOrder: 2,
    }),
    isEnrolled: async () => true,
    loadKnowledge: async () => knowledge,
    usage: async () => ({ userMsgsToday: 0, globalTokensToday: 0 }),
    limits: { dailyMsgCap: 30, dailyTokenBudget: 2_000_000 },
    systemPrompt: "sys",
    generate: async (input) => {
      over.generateSpy?.();
      return over.generate ? over.generate(input) : gen;
    },
    ...over,
  };
}
const ASK = {
  userId: "u1",
  lessonId: "l2",
  question: "system prompt kya karta hai?",
};

describe("engine: runGuruTurn state machine", () => {
  it("ANSWERED with a citation when in scope", async () => {
    const t = await runGuruTurn(ASK, deps());
    expect(t.verdict).toBe("ANSWERED");
    expect(t.citations.length).toBeGreaterThan(0);
    expect(t.citations[0].lessonOrder).toBe(2);
    expect(t.completionTokens).toBe(12);
  });

  it("BLOCKED on an income question WITHOUT calling the model", async () => {
    let called = false;
    const t = await runGuruTurn(
      { ...ASK, question: "kitna kamaunga isse?" },
      deps({ generateSpy: () => (called = true) }),
    );
    expect(t.verdict).toBe("BLOCKED");
    expect(t.answer).toBe(GURU_INCOME_REDIRECT);
    expect(called).toBe(false);
    expect(t.completionTokens).toBe(0);
  });

  it("BLOCKED when the model's answer sneaks in income talk (answer-side guardrail)", async () => {
    const t = await runGuruTurn(
      ASK,
      deps({
        generate: async () => ({
          answer: "Aap ise complete karke ₹50000 kamaa sakte ho",
          promptTokens: 30,
          completionTokens: 8,
          costPaise: 1,
        }),
      }),
    );
    expect(t.verdict).toBe("BLOCKED");
    expect(t.answer).toBe(GURU_INCOME_REDIRECT);
    expect(t.completionTokens).toBe(8); // tokens still accounted — the call happened
  });

  it("REDIRECTED when the question is out of the course's scope", async () => {
    const t = await runGuruTurn(
      { ...ASK, question: "chess castling rules" },
      deps(),
    );
    expect(t.verdict).toBe("REDIRECTED");
  });

  it("EMPTY when the course has no knowledge yet", async () => {
    const t = await runGuruTurn(ASK, deps({ loadKnowledge: async () => [] }));
    expect(t.verdict).toBe("EMPTY");
  });

  it("CAPPED when over the daily message cap, WITHOUT calling the model", async () => {
    let called = false;
    const t = await runGuruTurn(
      ASK,
      deps({
        usage: async () => ({ userMsgsToday: 30, globalTokensToday: 0 }),
        generateSpy: () => (called = true),
      }),
    );
    expect(t.verdict).toBe("CAPPED");
    expect(called).toBe(false);
  });

  it("REDIRECTED (enroll) when the learner is not enrolled", async () => {
    const t = await runGuruTurn(ASK, deps({ isEnrolled: async () => false }));
    expect(t.verdict).toBe("REDIRECTED");
  });

  it("ERROR (warm) when the provider throws", async () => {
    const t = await runGuruTurn(
      ASK,
      deps({
        generate: async () => {
          throw new Error("down");
        },
      }),
    );
    expect(t.verdict).toBe("ERROR");
  });
});
