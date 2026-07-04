// Learn tab (DR-030 §2 bottom-nav "Learn") — the learner's course home: Continue Learning + all
// enrolled courses. Moved here from /dashboard when that route became the Hub (Home). Never blank:
// shows a checkout CTA when there are no enrollments. The Lesson-0 system course is excluded upstream.
import Link from "next/link";
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { getEnrolledCourses } from "../../../lib/lms/queries";
import { ProgressRing } from "../../../components/dashboard/progress-ring";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

const GOAL_SUBLINE: Record<string, string> = {
  SKILL: "Let's sharpen a skill today.",
  INCOME: "Real skills come first — keep building.",
  BOTH: "Keep learning at your own pace.",
};

export default async function LearnPage() {
  const user = await getCurrentUserRecord();
  const courses = await getEnrolledCourses(user!.id);
  const greeting = `Your learning${user?.name ? `, ${user.name}` : ""}`;
  const subline =
    (user?.goal && GOAL_SUBLINE[user.goal]) ?? "Continue where you left off.";

  if (courses.length === 0) {
    return (
      <section aria-labelledby="learn-heading" className="space-y-5">
        <h1 id="learn-heading" className="font-heading text-2xl font-bold">
          Learn
        </h1>
        <Card className="text-center">
          <CardTitle>No courses yet</CardTitle>
          <CardDescription>
            Enroll to start learning — your first lesson is a free preview.
          </CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/packages">
              <Button>Explore courses</Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const active = courses.find((c) => c.progress.percent < 100) ?? courses[0];
  const cta =
    active.progress.completed === 0
      ? "Start Lesson 1"
      : active.resumeLessonId
        ? "Resume"
        : "Review";

  return (
    <section aria-labelledby="learn-heading" className="space-y-6">
      <div>
        <h1 id="learn-heading" className="font-heading text-2xl font-bold">
          {greeting}
        </h1>
        <p className="text-sm text-muted">{subline}</p>
      </div>

      <Card className="flex items-center gap-5">
        <ProgressRing percent={active.progress.percent} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Continue learning
          </p>
          <p className="truncate font-heading text-lg font-bold">
            {active.title}
          </p>
          <p className="text-sm text-muted">
            {active.progress.completed} / {active.progress.total} lessons
          </p>
          <div className="mt-3 max-w-[10rem]">
            <Link href={`/dashboard/learn/${active.slug}`}>
              <Button>{cta}</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-heading text-lg font-semibold">Your courses</h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-semibold text-brand"
          >
            View all →
          </Link>
        </div>
        {courses.map((c) => (
          <Link
            key={c.slug}
            href={`/dashboard/learn/${c.slug}`}
            className="block"
          >
            <Card className="flex items-center justify-between gap-4 transition-colors hover:border-brand/30">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                <p className="text-sm text-muted">
                  {c.progress.completed} / {c.progress.total} lessons ·{" "}
                  {c.progress.percent}%
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand">
                Open →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
