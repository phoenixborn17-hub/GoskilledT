// /courses — catalog grid (Ticket 5, Task 1). Server component, read-only. Category filter via
// ?category= (no client JS). PUBLISHED prominent; COMING_SOON honestly labeled.
import Link from "next/link";
import { listCatalogCourses, listPackages } from "../../lib/catalog/queries";
import { courseStats, courseCategories, packagesIncludingCourse } from "../../lib/catalog/shape";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { CourseCard, type CourseCardData } from "../../components/marketing/course-card";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

export const metadata = pageMetadata({
  title: "Courses",
  description: "Explore GoSkilled's practical, job-ready courses. Learn at your own pace in Hinglish.",
  path: "/courses",
});

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [courses, packages] = await Promise.all([listCatalogCourses(), listPackages()]);
  const categories = courseCategories(courses);

  const cards: CourseCardData[] = courses.map((c) => {
    const stats = courseStats(c.modules);
    return {
      slug: c.slug, title: c.title, summary: c.summary, category: c.category, status: c.status,
      lessonCount: stats.lessonCount, durationLabel: stats.durationLabel,
      packageNames: packagesIncludingCourse(c.slug, packages),
    };
  });
  const visible = category ? cards.filter((c) => c.category === category) : cards;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-extrabold">Courses</h1>
          {/* COPY: draft */}
          <p className="mt-1 text-charcoal/60">Practical skills you can use at work — start with a free preview lesson.</p>
        </header>

        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <FilterChip href="/courses" active={!category}>All</FilterChip>
            {categories.map((cat) => (
              <FilterChip key={cat} href={`/courses?category=${encodeURIComponent(cat)}`} active={category === cat}>{cat}</FilterChip>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <Card className="text-center text-charcoal/60">No courses in this category yet. <Link href="/courses" className="font-semibold text-brand">See all</Link></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <div key={c.slug} className="reveal"><CourseCard course={c} /></div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined}
      className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand text-brand-fg" : "border-charcoal/15 text-charcoal/70 hover:bg-brand/5")}>
      {children}
    </Link>
  );
}
