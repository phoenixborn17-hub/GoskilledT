// Read-only catalog queries for the marketing pages (Ticket 5). Server-only, no writes,
// no money/auth logic — just published catalog data for display.
import { prisma } from "../prisma";

const lessonStatsSelect = {
  select: { durationSec: true, isFreePreview: true },
} as const;

/** All catalog courses (PUBLISHED first, then COMING_SOON) with lesson stats for cards. */
export async function listCatalogCourses() {
  return prisma.course.findMany({
    where: { status: { in: ["PUBLISHED", "COMING_SOON"] } },
    orderBy: [{ status: "asc" }, { order: "asc" }], // enum order: DRAFT < PUBLISHED < COMING_SOON
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      modules: { select: { lessons: lessonStatsSelect } },
    },
  });
}

/** Full course detail with ordered modules + lessons for the [slug] page. Null if absent. */
export async function getCourseDetail(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              durationSec: true,
              isFreePreview: true,
            },
          },
        },
      },
    },
  });
}

/** Active packages with their course slugs — for the comparison table + course price context. */
export async function listPackages() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { priceInPaise: "asc" },
    select: {
      slug: true,
      name: true,
      priceInPaise: true,
      includesFutureCourses: true,
      courses: { select: { course: { select: { slug: true } } } },
    },
  });
  return packages.map((p) => ({
    ...p,
    courseSlugs: p.courses.map((c) => c.course.slug),
  }));
}

/** Published course slugs for the sitemap. */
export async function publishedCourseSlugs(): Promise<string[]> {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
