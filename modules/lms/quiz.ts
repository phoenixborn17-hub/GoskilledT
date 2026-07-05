// GPS-M5 §2.2 — quiz grading + validation. PURE (no I/O). The learner adapter records the result;
// the admin adapter validates before publish. Practice-first: unlimited retries, warm per-question
// feedback ("Sahi! Kyunki…"), pass = a threshold, not perfection.

export interface QuizQuestionSpec {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
}

export interface QuestionFeedback {
  selected: number; // -1 if unanswered
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
}

export interface GradedAttempt {
  score: number; // correct count
  total: number;
  passPercent: number;
  scorePercent: number;
  passed: boolean;
  feedback: QuestionFeedback[];
}

/** PURE: grade selected answers against the questions. `answers[i]` = chosen option index (or -1). */
export function gradeAttempt(
  questions: QuizQuestionSpec[],
  answers: number[],
  passPercent: number,
): GradedAttempt {
  const total = questions.length;
  const feedback: QuestionFeedback[] = questions.map((q, i) => {
    const selected = Number.isInteger(answers[i]) ? answers[i] : -1;
    const isCorrect = selected === q.correctIndex;
    return {
      selected,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation ?? null,
    };
  });
  const score = feedback.filter((f) => f.isCorrect).length;
  const scorePercent = total === 0 ? 0 : Math.round((score / total) * 100);
  const passed = total > 0 && scorePercent >= passPercent;
  return { score, total, passPercent, scorePercent, passed, feedback };
}

export type ValidateResult = { ok: true } | { ok: false; error: string };

/** PURE: a quiz must be well-formed before it can be PUBLISHED (admin gate). */
export function validateQuizForPublish(
  questions: QuizQuestionSpec[],
): ValidateResult {
  if (questions.length === 0)
    return { ok: false, error: "Add at least one question before publishing." };
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const n = i + 1;
    if (!q.prompt.trim())
      return { ok: false, error: `Question ${n} needs a prompt.` };
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2)
      return { ok: false, error: `Question ${n} needs at least 2 options.` };
    if (opts.length > 6)
      return { ok: false, error: `Question ${n} can have at most 6 options.` };
    if (
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    )
      return {
        ok: false,
        error: `Question ${n} has no valid correct answer marked.`,
      };
  }
  return { ok: true };
}
