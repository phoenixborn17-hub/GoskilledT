// /courses — catalog grid (Ticket 5, Task 1). Server component, read-only. Category filter via
// ?category= (no client JS). PUBLISHED prominent; COMING_SOON honestly labeled. Re-skinned to the
// Public Experience standard (kit + shell); data/logic unchanged.
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { listCatalogCourses, listPackages } from "../../lib/catalog/queries";
import {
  courseStats,
  courseCategories,
  packagesIncludingCourse,
} from "../../lib/catalog/shape";
import { pageMetadata } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import {
  PageHero,
  Section,
  TrustChips,
  CtaBand,
} from "../../components/marketing/kit";
import {
  CourseCard,
  type CourseCardData,
} from "../../components/marketing/course-card";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

export const metadata = pageMetadata({
  title: "Courses",
  description:
    "Explore GoSkilled's practical, job-ready courses. Learn at your own pace in Hinglish.",
  path: "/courses",
});

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [courses, packages] = await Promise.all([
    listCatalogCourses(),
    listPackages(),
  ]);
  const categories = courseCategories(courses);

  const cards: CourseCardData[] = courses.map((c) => {
    const stats = courseStats(c.modules);
    return {
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      category: c.category,
      status: c.status,
      lessonCount: stats.lessonCount,
      durationLabel: stats.durationLabel,
      hasFreePreview: stats.hasFreePreview,
      packageNames: packagesIncludingCourse(c.slug, packages),
    };
  });
  const visible = category
    ? cards.filter((c) => c.category === category)
    : cards;
  const liveCount = cards.filter((c) => c.status === "PUBLISHED").length;

  return (
    <MarketingShell>
      <main>
        <PageHero
          eyebrow="Courses"
          eyebrowIcon={GraduationCap}
          title="Learn a real, job-ready skill"
          subtitle="Practical lessons in simple Hinglish — start with a free preview, learn at your own pace, right from your phone."
        >
          <TrustChips className="justify-center" />
        </PageHero>

        <Section aria-labelledby="all-courses" reveal={false}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="all-courses"
              className="font-heading text-xl font-bold text-ink"
            >
              {category ? `${category} courses` : "All courses"}
            </h2>
            {liveCount > 0 && (
              <p className="text-sm text-muted">
                {liveCount} live now · more releasing soon
              </p>
            )}
          </div>

          {categories.length > 0 && (
            <div
              className="mb-8 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by category"
            >
              <FilterChip href="/courses" active={!category}>
                All
              </FilterChip>
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  href={`/courses?category=${encodeURIComponent(cat)}`}
                  active={category === cat}
                >
                  {cat}
                </FilterChip>
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <Card className="text-center text-muted">
              No courses in this category yet.{" "}
              <Link href="/courses" className="font-semibold text-brand">
                See all
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((c) => (
                <div key={c.slug} className="reveal">
                  <CourseCard course={c} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <CtaBand
          title="Not sure where to start?"
          subtitle="Join a free webinar to see how GoSkilled works — no payment, no pressure."
          ctaHref="/webinar"
          ctaLabel="Join a free webinar"
          secondaryHref="/packages"
          secondaryLabel="See packages"
        />
      </main>
    </MarketingShell>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-brand-fg"
          : "border-line/15 text-ink/70 hover:border-brand/30 hover:bg-brand/5",
      )}
    >
      {children}
    </Link>
  );
}
