// GPS-M5 §2.2 — pure quiz grading + publish-validation tests (no DB).
import { describe, it, expect } from "vitest";
import { gradeAttempt, validateQuizForPublish } from "../modules/lms/quiz";

const Q = [
  { prompt: "1", options: ["a", "b"], correctIndex: 0 },
  { prompt: "2", options: ["a", "b"], correctIndex: 1 },
  { prompt: "3", options: ["a", "b"], correctIndex: 0 },
  { prompt: "4", options: ["a", "b"], correctIndex: 1 },
];

describe("gradeAttempt", () => {
  it("scores all-correct as 100% pass", () => {
    const g = gradeAttempt(Q, [0, 1, 0, 1], 70);
    expect(g).toMatchObject({
      score: 4,
      total: 4,
      scorePercent: 100,
      passed: true,
    });
    expect(g.feedback.every((f) => f.isCorrect)).toBe(true);
  });

  it("applies the pass threshold (75% passes at 70, fails at 80)", () => {
    expect(gradeAttempt(Q, [0, 1, 0, 0], 70).passed).toBe(true); // 3/4 = 75%
    expect(gradeAttempt(Q, [0, 1, 0, 0], 80).passed).toBe(false);
  });

  it("treats unanswered (-1) as wrong and reveals the correct index", () => {
    const g = gradeAttempt(Q, [0, -1, 0, 1], 100);
    expect(g.score).toBe(3);
    expect(g.passed).toBe(false);
    expect(g.feedback[1]).toMatchObject({
      selected: -1,
      correctIndex: 1,
      isCorrect: false,
    });
  });

  it("never passes an empty quiz", () => {
    expect(gradeAttempt([], [], 0).passed).toBe(false);
  });
});

describe("validateQuizForPublish", () => {
  it("rejects empty, thin-option, and out-of-range-answer quizzes", () => {
    expect(validateQuizForPublish([]).ok).toBe(false);
    expect(
      validateQuizForPublish([{ prompt: "p", options: ["a"], correctIndex: 0 }])
        .ok,
    ).toBe(false);
    expect(
      validateQuizForPublish([
        { prompt: "", options: ["a", "b"], correctIndex: 0 },
      ]).ok,
    ).toBe(false);
    expect(
      validateQuizForPublish([
        { prompt: "p", options: ["a", "b"], correctIndex: 5 },
      ]).ok,
    ).toBe(false);
  });
  it("accepts a well-formed quiz", () => {
    expect(
      validateQuizForPublish([
        { prompt: "p", options: ["a", "b", "c"], correctIndex: 2 },
      ]).ok,
    ).toBe(true);
  });
});
