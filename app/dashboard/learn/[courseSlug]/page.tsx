// Course player (Ticket 4, Task 3 · re-skinned in Command_Center_Spec §4.1 Slice 3 — presentation
// ONLY). Server-side access control — the client is NEVER trusted: a locked lesson never receives
// a playback URL. Enrollment required, except free-preview lessons (authenticated users only,
// enforced by the dashboard layout guard). The shell renders this route in FOCUS MODE (slim icon
// rail, no competing topbar label) — this page owns its header: course title + the ring that fills.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import {
  getCoursePlayerView,
  resolvePlayback,
} from "../../../../lib/lms/queries";
import { getVideoProvider } from "../../../../lib/video/provider";
import { nextLessonId } from "../../../../modules/lms/progress";
import { LessonPlayer } from "../../../../components/dashboard/lesson-player";
import { GuruPanel } from "../../../../components/dashboard/guru/guru-panel";
import { guruEnabled } from "../../../../lib/flags";
import { QuizCheckpoint } from "../../../../components/dashboard/quiz/quiz-checkpoint";
import { getPublishedQuizForLearner } from "../../../../lib/lms/quiz";
import { DecisionCard } from "../../../../components/cards/decision/decision-card";
import { ProgressRing } from "../../../../components/data/progress-ring";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";

export const dynamic = "force-dynamic";

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ lesson?: string; guru?: string; q?: string }>;
}) {
  const { courseSlug } = await params;
  const { lesson: lessonParam, guru, q } = await searchParams;

  const user = await getCurrentUser();
  const view = await getCoursePlayerView(user!.id, courseSlug);
  if (!view) notFound();

  const flat = view.modules.flatMap((m) => m.lessons);
  if (flat.length === 0) {
    return (
      <p className="text-small text-ink-muted">
        This course has no lessons yet.
      </p>
    );
  }

  // Pick the lesson: a valid ?lesson= wins; otherwise resume; otherwise the first lesson.
  const selected =
    flat.find((l) => l.id === lessonParam) ??
    flat.find((l) => l.id === view.resumeLessonId) ??
    flat[0];
  const next = nextLessonId(view.orderedLessonIds, selected.id);
  const nextTitle = next
    ? (flat.find((l) => l.id === next)?.title ?? null)
    : null;

  // Only resolve a playback URL if the lesson is actually accessible (server-side gate).
  const playback = resolvePlayback(selected, getVideoProvider());

  // Quiz checkpoint (GPS-M5 §2.2): only when the lesson is accessible + a PUBLISHED quiz exists.
  const quiz = playback
    ? await getPublishedQuizForLearner(user!.id, selected.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Player header — Back · course title · THE RING THAT FILLS (Spark on its endpoint, bound
          to real course completion; ticks forward via the CSS dashoffset transition when a
          completion refreshes this server payload). Replaces the bare "3 / 12 lessons" line —
          the count stays as the ring's accessible name + the caption. */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard/learn"
            className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Learn
          </Link>
          <h1 className="mt-1 truncate font-heading text-h2 font-extrabold text-ink">
            {view.course.title}
          </h1>
          <p className="mt-0.5 text-caption tabular-nums text-ink-muted">
            {view.progress.completed} / {view.progress.total} lessons complete
          </p>
        </div>
        <div className="dc-accent-green shrink-0">
          <ProgressRing
            value={view.progress.percent}
            size={56}
            strokeWidth={6}
            spark
            label={`Course progress: ${view.progress.completed} of ${view.progress.total} lessons complete`}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr,18rem]">
        {/* min-w-0: grid items default to min-width:auto, so the <video>'s intrinsic min-content
            width couldn't shrink below the 360px column → ~6px horizontal overflow (QA-01). */}
        <div className="min-w-0">
          {playback ? (
            <LessonPlayer
              courseSlug={courseSlug}
              courseTitle={view.course.title}
              lessonId={selected.id}
              title={selected.title}
              src={playback.url}
              poster={playback.poster}
              initiallyCompleted={selected.completed}
              nextLessonId={next}
              nextLessonTitle={nextTitle}
            />
          ) : (
            <DecisionCard
              icon={Lock}
              label="Locked lesson"
              accent="neutral"
              size="primary"
            >
              <div className="text-center">
                <h2 className="font-heading text-h3 font-bold text-ink">
                  This lesson is locked
                </h2>
                <p className="mx-auto mt-2 max-w-prose text-body text-ink-muted">
                  Enroll in this course to unlock all lessons. Lesson 1 is a
                  free preview.
                </p>
                <div className="mx-auto mt-5 max-w-xs">
                  {/* Honest CTA: a locked course may come via Skill Builder OR Career Booster —
                      the packages page is the truthful chooser (was hardcoded career-booster). */}
                  <Link href="/dashboard/learn/browse#packages">
                    <Button>See packages</Button>
                  </Link>
                </div>
              </div>
            </DecisionCard>
          )}

          {/* Quiz checkpoint after the lesson (GPS-M5 §2.2) — practice → real skill + cert gate. */}
          {quiz && (
            <div className="mt-6">
              <QuizCheckpoint
                quiz={quiz}
                courseSlug={courseSlug}
                lessonId={selected.id}
              />
            </div>
          )}
        </div>

        {/* Lesson list — module hierarchy (§4.1): Sora module headers with real per-module
            progress; the active row speaks the dc-accent language (bar + tint). */}
        <aside aria-label="Lessons" className="min-w-0 space-y-4">
          {view.modules.map((m) => {
            const done = m.lessons.filter((l) => l.completed).length;
            return (
              <div
                key={m.id}
                className="rounded-gs-lg border border-line bg-surface-raised p-3"
              >
                <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
                  <p className="min-w-0 truncate font-heading text-small font-bold text-ink">
                    {m.title}
                  </p>
                  <p
                    className="shrink-0 text-caption tabular-nums text-ink-muted"
                    aria-label={`${done} of ${m.lessons.length} lessons complete in this module`}
                  >
                    {done}/{m.lessons.length}
                  </p>
                </div>
                <ul className="space-y-1">
                  {m.lessons.map((l) => {
                    const isCurrent = l.id === selected.id;
                    const Icon = l.completed
                      ? CheckCircle2
                      : l.locked
                        ? Lock
                        : PlayCircle;
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/dashboard/learn/${courseSlug}?lesson=${l.id}`}
                          aria-current={isCurrent ? "true" : undefined}
                          className={cn(
                            "relative flex items-center gap-2 rounded-gs px-3 py-2 text-small transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
                            isCurrent
                              ? "bg-theme/10 font-semibold text-theme-strong"
                              : "text-ink-muted hover:bg-charcoal/5 hover:text-ink",
                          )}
                        >
                          {isCurrent && (
                            <span
                              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-theme"
                              aria-hidden
                            />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              l.completed ? "text-success" : "text-ink-muted",
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {l.title}
                          </span>
                          {l.isFreePreview && !l.completed && (
                            <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-charcoal">
                              FREE
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </aside>
      </div>

      {/* Guru companion panel (GPS-M5 §2.1) — DISABLED behind guruEnabled() (Nav_Workspace v1.1).
          Code kept in-tree; flip the flag to restore. Deep-links (?guru=1&q=) become inert. */}
      {guruEnabled() && (
        <GuruPanel
          lessonId={selected.id}
          courseSlug={courseSlug}
          enrolled={view.isEnrolled}
          initialOpen={guru === "1"}
          initialQuestion={q}
        />
      )}
    </div>
  );
}
