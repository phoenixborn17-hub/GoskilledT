// My courses (GPS-M2 §2.2 · Redesign U4) — re-skinned onto CourseCards. What I own + a Buy CTA on
// non-owned catalog courses + (Career Booster) the honest "as released" roadmap. Server component,
// noindex. Never blank. No business-logic change — same entitlement + roadmap data.
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import {
  getEnrollmentsWithRoadmap,
  getEnrolledCourses,
} from "../../../lib/lms/queries";
import { listCatalogCourses } from "../../../lib/catalog/queries";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { CourseCard } from "../../../components/cards/course-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Courses" };

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  const [{ enrolled, hasCareerBooster, roadmap }, ownedList, catalog] =
    await Promise.all([
      getEnrollmentsWithRoadmap(user!.id),
      getEnrolledCourses(user!.id),
      listCatalogCourses(),
    ]);

  const ownedSlugs = new Set(ownedList.map((c) => c.slug));
  const roadmapSlugs = new Set(roadmap.map((c) => c.slug));
  const discover = catalog.filter(
    (c) =>
      c.status === "PUBLISHED" &&
      !ownedSlugs.has(c.slug) &&
      !roadmapSlugs.has(c.slug),
  );

  return (
    <section aria-labelledby="courses-heading" className="space-y-8">
      <h1
        id="courses-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        My courses
      </h1>

      {enrolled.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="You don't own any courses yet"
            description="Pick a package to start learning — your first lesson is a free preview."
            action={
              <Link href="/dashboard/learn/browse#packages">
                <Button className="w-full">See packages</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrolled.map((c) => {
            const cta =
              c.progress.percent === 100
                ? "Review"
                : c.progress.completed === 0
                  ? "Start"
                  : "Resume";
            return (
              <CourseCard
                key={c.slug}
                title={c.title}
                meta={`${c.progress.completed} / ${c.progress.total} lessons`}
                progress={c.progress.percent}
                owned
                action={
                  <Link href={`/dashboard/learn/${c.slug}`}>
                    <Button
                      variant={
                        c.progress.percent === 100 ? "outline" : "primary"
                      }
                      className="w-full"
                    >
                      {cta}
                    </Button>
                  </Link>
                }
              />
            );
          })}
        </div>
      )}

      {/* Career Booster: honest "as released" roadmap (DR-021) — included, no extra charge. */}
      {hasCareerBooster && roadmap.length > 0 && (
        <section aria-labelledby="roadmap-heading" className="space-y-3">
          <div>
            <h2
              id="roadmap-heading"
              className="font-heading text-h4 font-bold text-ink"
            >
              Included in your package — as released
            </h2>
            <p className="text-small text-ink-muted">
              Career Booster includes these courses as they&apos;re released —
              added to your account automatically, no extra charge, no dates
              promised.
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {roadmap.map((c) => (
              <li key={c.slug}>
                <Card className="flex items-start gap-3 bg-theme/5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme/10 text-theme-strong"
                    aria-hidden
                  >
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink">{c.title}</p>
                      <Badge variant="gold">As released</Badge>
                    </div>
                    {c.summary && (
                      <p className="mt-0.5 line-clamp-2 text-small text-ink-muted">
                        {c.summary}
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Discover more — non-owned catalog courses with a Buy CTA (IA §5.2). */}
      {discover.length > 0 && (
        <section aria-labelledby="discover-heading" className="space-y-3">
          <h2
            id="discover-heading"
            className="font-heading text-h4 font-bold text-ink"
          >
            Discover more courses
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {discover.map((c) => (
              <CourseCard
                key={c.slug}
                title={c.title}
                meta={c.summary ?? undefined}
                action={
                  <Link href={`/courses/${c.slug}`}>
                    <Button variant="outline" className="w-full">
                      View &amp; buy
                    </Button>
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
