"use client";
// GPS-M5 §2.2 — learner quiz checkpoint (Register 1). Practice-first: MCQ, instant warm per-question
// feedback ("Sahi! Kyunki…"), unlimited retries, a small pass-delight moment. Passive video ≠ skill.
import { useState } from "react";
import { CheckCircle2, XCircle, Award, RotateCcw } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Confetti } from "../../ui/confetti";
import { cn } from "../../../lib/utils";
import { submitQuizAttemptAction } from "../../../app/dashboard/quiz-actions";
import type { LearnerQuizView } from "../../../lib/lms/quiz";
import type { GradedAttempt } from "../../../modules/lms/quiz";

export function QuizCheckpoint({
  quiz,
  courseSlug,
  lessonId,
}: {
  quiz: LearnerQuizView;
  courseSlug: string;
  lessonId: string;
}) {
  const [answers, setAnswers] = useState<number[]>(() =>
    quiz.questions.map(() => -1),
  );
  const [result, setResult] = useState<GradedAttempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await submitQuizAttemptAction({
      lessonId,
      courseSlug,
      answers,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setResult(res.graded);
    if (res.graded.passed) setCelebrate(true);
  }

  function retry() {
    setResult(null);
    setCelebrate(false);
    setAnswers(quiz.questions.map(() => -1));
  }

  // Already-cleared, not currently retrying → calm cleared state.
  if (quiz.alreadyPassed && !result) {
    return (
      <Card className="border-theme/20 bg-theme/5">
        <div className="flex items-center gap-3">
          <CheckCircle2
            className="h-6 w-6 shrink-0 text-theme-strong"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-ink">
              Checkpoint clear ✓
            </p>
            <p className="text-small text-ink-muted">
              Aapne ye quiz pass kar liya hai. Dobara try karna ho to —
            </p>
          </div>
          <div className="w-auto">
            <Button variant="ghost" onClick={retry} className="w-auto px-3">
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden /> Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <Confetti fire={celebrate} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-h4 font-bold text-ink">
            {quiz.title}
          </h2>
          <Badge variant="brand">Checkpoint</Badge>
        </div>
        {quiz.isMandatory && (
          <span className="inline-flex items-center gap-1 text-caption font-medium text-ink-muted">
            <Award className="h-3.5 w-3.5" aria-hidden /> Certificate ke liye
            zaroori
          </span>
        )}
      </div>

      <ol className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const fb = result?.feedback[qi];
          return (
            <li key={q.id}>
              <fieldset disabled={busy || !!result}>
                <legend className="mb-2 flex gap-2 text-small font-semibold text-ink">
                  <span className="text-ink-muted">{qi + 1}.</span>
                  <span>{q.prompt}</span>
                </legend>
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label={`Question ${qi + 1}`}
                >
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    const isAnswer = fb && fb.correctIndex === oi;
                    const isWrongPick =
                      fb && fb.selected === oi && !fb.isCorrect;
                    return (
                      <button
                        key={oi}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setAnswers((a) =>
                            a.map((v, i) => (i === qi ? oi : v)),
                          )
                        }
                        className={cn(
                          "press flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-small transition-colors",
                          isAnswer
                            ? "border-theme bg-theme/10 text-ink"
                            : isWrongPick
                              ? "border-danger/40 bg-danger/5 text-ink"
                              : selected
                                ? "border-theme bg-theme/5 text-ink"
                                : "border-charcoal/15 text-ink hover:bg-charcoal/5",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            selected || isAnswer
                              ? "border-theme"
                              : "border-charcoal/30",
                          )}
                          aria-hidden
                        >
                          {isAnswer ? (
                            <CheckCircle2 className="h-5 w-5 text-theme-strong" />
                          ) : isWrongPick ? (
                            <XCircle className="h-5 w-5 text-danger" />
                          ) : selected ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-theme" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {fb && fb.explanation && (
                  <p
                    className={cn(
                      "mt-2 rounded-lg px-3 py-2 text-caption",
                      fb.isCorrect
                        ? "bg-theme/5 text-ink"
                        : "bg-charcoal/5 text-ink-muted",
                    )}
                  >
                    {fb.isCorrect ? "Sahi! " : ""}
                    {fb.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      {/* Result banner + actions */}
      {result ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl p-4",
            result.passed ? "bg-theme/10" : "bg-charcoal/5",
          )}
        >
          {result.passed ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-theme-strong" aria-hidden />
              <p className="flex-1 text-small font-semibold text-ink">
                Shabaash! {result.scorePercent}% — checkpoint clear 🎉
              </p>
            </>
          ) : (
            <>
              <p className="flex-1 text-small font-medium text-ink">
                {result.scorePercent}% — thodi aur practice. Upar sahi jawab
                dekho, phir se try karo.
              </p>
              <div className="w-auto">
                <Button onClick={retry} className="w-auto px-4">
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden /> Try again
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-[12rem]">
          <Button onClick={submit} disabled={busy || !allAnswered}>
            {busy
              ? "Checking…"
              : allAnswered
                ? "Submit"
                : "Answer all to submit"}
          </Button>
        </div>
      )}
    </Card>
  );
}
