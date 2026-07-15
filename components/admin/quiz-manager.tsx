"use client";
// GPS-M5 §2.2 — admin quiz manager (Register 3: efficient, dense, clear). Per lesson: Guru-draft →
// edit → publish. Art 6: generation only DRAFTS; publish is an explicit action. One editor open at a time.
import { useState } from "react";
import { Sparkles, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import type { CourseLessonQuiz, AdminQuestion } from "../../lib/admin/quiz";
import {
  saveQuizDraftAction,
  generateQuizDraftAction,
  publishQuizAction,
  unpublishQuizAction,
} from "../../app/admin/catalog/quiz-actions";

interface Draft {
  title: string;
  isMandatory: boolean;
  passPercent: number;
  questions: AdminQuestion[];
}
const blankQ = (): AdminQuestion => ({
  prompt: "",
  options: ["", ""],
  correctIndex: 0,
  explanation: "",
});
const inputCls =
  "w-full rounded-lg border border-line px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function AdminQuizManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: CourseLessonQuiz[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function edit(l: CourseLessonQuiz) {
    setError(null);
    setOpen(l.lessonId);
    setDraft(
      l.quiz
        ? {
            title: l.quiz.title,
            isMandatory: l.quiz.isMandatory,
            passPercent: l.quiz.passPercent,
            questions: l.quiz.questions.map((q) => ({ ...q })),
          }
        : {
            title: `${l.lessonTitle} — checkpoint`,
            isMandatory: false,
            passPercent: 70,
            questions: [blankQ()],
          },
    );
  }

  async function run(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setBusy(key);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    return res.ok;
  }

  async function generate(lessonId: string) {
    const ok = await run("gen-" + lessonId, async () => {
      const res = await generateQuizDraftAction(courseId, lessonId);
      if (res.ok && draft)
        setDraft({ ...draft, questions: res.questions.map((q) => ({ ...q })) });
      return res;
    });
    return ok;
  }

  function patchQ(i: number, patch: Partial<AdminQuestion>) {
    if (!draft) return;
    setDraft({
      ...draft,
      questions: draft.questions.map((q, qi) =>
        qi === i ? { ...q, ...patch } : q,
      ),
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-ink">
          Quizzes
        </h2>
        <p className="text-sm text-muted">
          Per-lesson checkpoints. Guru drafts; you edit and publish. Mandatory
          quizzes are required for the course certificate.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-line">
        {lessons.map((l) => {
          const isOpen = open === l.lessonId;
          return (
            <li key={l.lessonId} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {l.lessonTitle}
                  <span className="ml-2 text-xs text-muted">
                    {l.moduleTitle}
                  </span>
                </span>
                {l.quiz ? (
                  <Badge
                    variant={l.quiz.status === "PUBLISHED" ? "brand" : "muted"}
                  >
                    {l.quiz.status === "PUBLISHED" ? "Published" : "Draft"}
                    {l.quiz.isMandatory ? " · required" : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline">No quiz</Badge>
                )}
                <Button
                  variant="ghost"
                  className="w-auto px-3"
                  onClick={() => (isOpen ? setOpen(null) : edit(l))}
                >
                  {isOpen ? "Close" : l.quiz ? "Edit" : "Add quiz"}
                </Button>
              </div>

              {isOpen && draft && (
                <div className="mt-3 space-y-4 rounded-xl border border-line bg-charcoal/[0.02] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      aria-label="Quiz title"
                      className={cn(inputCls, "flex-1")}
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                    />
                    <label className="flex items-center gap-1.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={draft.isMandatory}
                        onChange={(e) =>
                          setDraft({ ...draft, isMandatory: e.target.checked })
                        }
                      />
                      Required for certificate
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-ink">
                      Pass %
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className={cn(inputCls, "w-20")}
                        value={draft.passPercent}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            passPercent: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <Button
                      variant="outline"
                      className="w-auto px-3"
                      disabled={busy === "gen-" + l.lessonId}
                      onClick={() => generate(l.lessonId)}
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
                      {busy === "gen-" + l.lessonId
                        ? "Guru drafting…"
                        : "Draft with Guru"}
                    </Button>
                  </div>

                  <ol className="space-y-4">
                    {draft.questions.map((q, qi) => (
                      <li
                        key={qi}
                        className="rounded-lg border border-line p-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-2 text-xs text-muted">
                            {qi + 1}.
                          </span>
                          <input
                            aria-label={`Question ${qi + 1} prompt`}
                            placeholder="Question prompt"
                            className={cn(inputCls, "flex-1")}
                            value={q.prompt}
                            onChange={(e) =>
                              patchQ(qi, { prompt: e.target.value })
                            }
                          />
                          <button
                            type="button"
                            aria-label="Remove question"
                            className="press mt-1 text-muted hover:text-danger"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                questions: draft.questions.filter(
                                  (_, i) => i !== qi,
                                ),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 space-y-1.5 pl-5">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                aria-label={`Mark option ${oi + 1} correct`}
                                checked={q.correctIndex === oi}
                                onChange={() =>
                                  patchQ(qi, { correctIndex: oi })
                                }
                              />
                              <input
                                aria-label={`Option ${oi + 1}`}
                                placeholder={`Option ${oi + 1}`}
                                className={cn(inputCls, "flex-1")}
                                value={opt}
                                onChange={(e) =>
                                  patchQ(qi, {
                                    options: q.options.map((o, i) =>
                                      i === oi ? e.target.value : o,
                                    ),
                                  })
                                }
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  aria-label="Remove option"
                                  className="press text-muted hover:text-danger"
                                  onClick={() =>
                                    patchQ(qi, {
                                      options: q.options.filter(
                                        (_, i) => i !== oi,
                                      ),
                                      correctIndex:
                                        q.correctIndex >= oi &&
                                        q.correctIndex > 0
                                          ? q.correctIndex - 1
                                          : q.correctIndex,
                                    })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {q.options.length < 6 && (
                            <button
                              type="button"
                              className="press inline-flex items-center gap-1 text-xs font-semibold text-brand"
                              onClick={() =>
                                patchQ(qi, { options: [...q.options, ""] })
                              }
                            >
                              <Plus className="h-3.5 w-3.5" /> Add option
                            </button>
                          )}
                          <input
                            aria-label="Explanation"
                            placeholder="Warm explanation (Sahi! Kyunki…)"
                            className={cn(inputCls, "mt-1")}
                            value={q.explanation ?? ""}
                            onChange={(e) =>
                              patchQ(qi, { explanation: e.target.value })
                            }
                          />
                        </div>
                      </li>
                    ))}
                  </ol>

                  <button
                    type="button"
                    className="press inline-flex items-center gap-1 text-sm font-semibold text-brand"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        questions: [...draft.questions, blankQ()],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add question
                  </button>

                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button
                      className="w-auto px-4"
                      disabled={busy === "save-" + l.lessonId}
                      onClick={() =>
                        run("save-" + l.lessonId, () =>
                          saveQuizDraftAction(courseId, l.lessonId, draft),
                        )
                      }
                    >
                      {busy === "save-" + l.lessonId ? "Saving…" : "Save draft"}
                    </Button>
                    {l.quiz?.status === "PUBLISHED" ? (
                      <Button
                        variant="outline"
                        className="w-auto px-4"
                        disabled={busy === "unpub-" + l.lessonId}
                        onClick={() =>
                          run("unpub-" + l.lessonId, () =>
                            unpublishQuizAction(courseId, l.lessonId),
                          )
                        }
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        className="w-auto px-4"
                        disabled={busy === "pub-" + l.lessonId}
                        onClick={async () => {
                          // Save first so the published version matches what's on screen.
                          const saved = await run("pub-" + l.lessonId, () =>
                            saveQuizDraftAction(courseId, l.lessonId, draft),
                          );
                          if (saved)
                            await run("pub-" + l.lessonId, () =>
                              publishQuizAction(courseId, l.lessonId),
                            );
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />{" "}
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
