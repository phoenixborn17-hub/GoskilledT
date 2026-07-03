// Course player (Ticket 4, Task 3). Server-side access control — the client is NEVER trusted:
// a locked lesson never receives a playback URL. Enrollment required, except free-preview
// lessons (authenticated users only, enforced by the dashboard layout guard).
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import { getCoursePlayerView } from "../../../../lib/lms/queries";
import { getVideoProvider } from "../../../../lib/video/provider";
import { nextLessonId } from "../../../../modules/lms/progress";
import { LessonPlayer } from "../../../../components/dashboard/lesson-player";
import { Card, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";

export const dynamic = "force-dynamic";

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseSlug } = await params;
  const { lesson: lessonParam } = await searchParams;

  const user = await getCurrentUser();
  const view = await getCoursePlayerView(user!.id, courseSlug);
  if (!view) notFound();

  const flat = view.modules.flatMap((m) => m.lessons);
  if (flat.length === 0) {
    return <p className="text-sm text-muted">This course has no lessons yet.</p>;
  }

  // Pick the lesson: a valid ?lesson= wins; otherwise resume; otherwise the first lesson.
  const selected = flat.find((l) => l.id === lessonParam) ?? flat.find((l) => l.id === view.resumeLessonId) ?? flat[0];
  const next = nextLessonId(view.orderedLessonIds, selected.id);

  // Only resolve a playback URL if the lesson is actually accessible (server-side gate).
  const playback = selected.locked || !selected.videoAssetId ? null : getVideoProvider().getPlayback(selected.videoAssetId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-brand">← Back</Link>
        <h1 className="font-heading text-2xl font-bold">{view.course.title}</h1>
        <p className="text-sm text-muted">{view.progress.completed} / {view.progress.total} lessons complete</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr,18rem]">
        <div>
          {playback ? (
            <LessonPlayer
              courseSlug={courseSlug}
              lessonId={selected.id}
              title={selected.title}
              src={playback.url}
              poster={playback.poster}
              initiallyCompleted={selected.completed}
              nextLessonId={next}
            />
          ) : (
            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5" aria-hidden>
                <Lock className="h-5 w-5 text-muted" />
              </div>
              <CardTitle>This lesson is locked</CardTitle>
              <CardDescription>Enroll in this course to unlock all lessons. Lesson 1 is a free preview.</CardDescription>
              <div className="mx-auto mt-5 max-w-xs">
                <Link href="/checkout?package=career-booster"><Button>Enroll now</Button></Link>
              </div>
            </Card>
          )}
        </div>

        <aside aria-label="Lessons" className="space-y-4">
          {view.modules.map((m) => (
            <div key={m.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{m.title}</p>
              <ul className="space-y-1">
                {m.lessons.map((l) => {
                  const isCurrent = l.id === selected.id;
                  const Icon = l.completed ? CheckCircle2 : l.locked ? Lock : PlayCircle;
                  return (
                    <li key={l.id}>
                      <Link href={`/dashboard/learn/${courseSlug}?lesson=${l.id}`}
                        aria-current={isCurrent ? "true" : undefined}
                        className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          isCurrent ? "bg-brand/10 font-semibold text-brand" : "text-charcoal/70 hover:bg-charcoal/5")}>
                        <Icon className={cn("h-4 w-4 shrink-0", l.completed ? "text-brand" : "text-muted")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        {l.isFreePreview && !l.completed && (
                          <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-charcoal">FREE</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
