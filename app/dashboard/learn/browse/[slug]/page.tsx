// In-app course detail (Command_Center_Spec §4.3 · Slice 5). Discovery inside the shell: the same
// read-only catalog detail the public page uses (no entitlement/checkout logic here), curriculum
// with honest free-preview/lock markers, packages-that-include-it context, checkout entered from
// in-app. An ENROLLED viewer is redirected to the player — one source of truth for owned courses.
// COMING_SOON renders honestly (no curriculum theater, no dates). D-29 throughout.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Lock,
  PlayCircle,
  BookOpen,
  CalendarClock,
} from "lucide-react";
import { getCurrentUser } from "../../../../../lib/auth/session";
import {
  getCourseDetail,
  listPackages,
} from "../../../../../lib/catalog/queries";
import { isEnrolled } from "../../../../../lib/lms/queries";
import {
  courseStats,
  formatDuration,
  packagesIncludingCourse,
} from "../../../../../lib/catalog/shape";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { DecisionCard } from "../../../../../components/cards/decision/decision-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  return { title: course ? course.title : "Course" };
}

export default async function BrowseCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const [course, packages] = await Promise.all([
    getCourseDetail(slug),
    listPackages(),
  ]);
  // DRAFT courses come back from getCourseDetail — browse shows the public catalog only.
  if (!course || course.status === "DRAFT") notFound();

  // Owned → the player IS the detail page (single source of truth).
  if (await isEnrolled(user!.id, course.id)) {
    redirect(`/dashboard/learn/${course.slug}`);
  }

  const comingSoon = course.status === "COMING_SOON";
  const stats = courseStats(course.modules);
  const inPackages = packagesIncludingCourse(course.slug, packages);
  const freePreviewLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.isFreePreview);

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/dashboard/learn/browse"
          className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Browse
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-h1 font-extrabold text-ink">
            {course.title}
          </h1>
          {comingSoon ? (
            <Badge variant="gold">Coming soon</Badge>
          ) : (
            course.category && <Badge variant="brand">{course.category}</Badge>
          )}
        </div>
        {course.summary && (
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            {course.summary}
          </p>
        )}
        {!comingSoon && (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" aria-hidden />
              {stats.lessonCount} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {stats.durationLabel}
            </span>
            {stats.hasFreePreview && <span>Lesson 1 free preview</span>}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        {/* Curriculum — honest markers: free preview playable, the rest locked until purchase. */}
        <section aria-label="Curriculum" className="min-w-0 space-y-4">
          {comingSoon ? (
            <DecisionCard
              icon={CalendarClock}
              label="In production"
              accent="neutral"
              size="primary"
            >
              <p className="max-w-prose text-body text-ink-muted">
                This course is being produced. Career Booster owners get it
                automatically when it releases — honestly labeled, no dates
                promised.
              </p>
            </DecisionCard>
          ) : (
            course.modules.map((m) => (
              <div
                key={m.id}
                className="rounded-gs-lg border border-line bg-surface-raised p-4"
              >
                <p className="mb-2 font-heading text-small font-bold text-ink">
                  {m.title}
                </p>
                <ul className="space-y-1">
                  {m.lessons.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-2 rounded-gs px-2 py-1.5 text-small text-ink-muted"
                    >
                      {l.isFreePreview ? (
                        <PlayCircle
                          className="h-4 w-4 shrink-0 text-theme-strong"
                          aria-hidden
                        />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      {l.durationSec > 0 && (
                        <span className="shrink-0 text-caption tabular-nums">
                          {formatDuration(l.durationSec)}
                        </span>
                      )}
                      {l.isFreePreview && (
                        <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-charcoal">
                          FREE
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        {/* Get-it card — checkout entered from in-app; purchase logic untouched. */}
        <aside className="min-w-0">
          <DecisionCard
            icon={BookOpen}
            label="Get this course"
            accent="green"
            size="primary"
          >
            <div className="space-y-4">
              {inPackages.length > 0 ? (
                <p className="text-small text-ink-muted">
                  Included in{" "}
                  <span className="font-semibold text-ink">
                    {inPackages.join(" and ")}
                  </span>
                  . One price, no hidden charges, 48-hour refund.
                </p>
              ) : (
                <p className="text-small text-ink-muted">
                  Included with Career Booster as released — no dates promised.
                </p>
              )}
              {!comingSoon && freePreviewLesson && (
                <Link
                  href={`/dashboard/learn/${course.slug}?lesson=${freePreviewLesson.id}`}
                  className="block"
                >
                  <Button variant="outline">Watch the free preview</Button>
                </Link>
              )}
              <Link href="/dashboard/learn/browse#packages" className="block">
                <Button>See packages</Button>
              </Link>
            </div>
          </DecisionCard>
        </aside>
      </div>
    </div>
  );
}
