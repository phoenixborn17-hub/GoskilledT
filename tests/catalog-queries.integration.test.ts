// Ticket 5, Task 6 — catalog queries against seeded data (skips without DATABASE_URL).
// Backs the marketing pages: the data they render is present and correctly shaped.
import { describe, it, expect } from "vitest";
import {
  listCatalogCourses,
  getCourseDetail,
  listPackages,
  publishedCourseSlugs,
} from "@/lib/catalog/queries";
import { courseStats } from "@/lib/catalog/shape";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("catalog queries (integration, seeded)", () => {
  it("lists the AI course as PUBLISHED with lessons", async () => {
    const courses = await listCatalogCourses();
    const ai = courses.find((c) => c.slug === "ai-prompt-mastery");
    expect(ai?.status).toBe("PUBLISHED");
    expect(courseStats(ai!.modules).lessonCount).toBeGreaterThanOrEqual(6);
  });

  it("keeps Digital Marketing honestly COMING_SOON", async () => {
    const courses = await listCatalogCourses();
    expect(courses.find((c) => c.slug === "digital-marketing")?.status).toBe(
      "COMING_SOON",
    );
  });

  it("course detail has ordered modules, lessons, and a free preview", async () => {
    const course = await getCourseDetail("ai-prompt-mastery");
    expect(course).not.toBeNull();
    expect(course!.modules.length).toBe(2);
    const flat = course!.modules.flatMap((m) => m.lessons);
    expect(flat.length).toBe(6);
    expect(flat.some((l) => l.isFreePreview)).toBe(true);
  });

  it("lists both packages with GST-inclusive prices and course slugs", async () => {
    const packages = await listPackages();
    const sb = packages.find((p) => p.slug === "skill-builder");
    const cb = packages.find((p) => p.slug === "career-booster");
    expect(sb?.priceInPaise).toBe(149900);
    expect(cb?.priceInPaise).toBe(219900);
    expect(cb?.includesFutureCourses).toBe(true);
    expect(cb?.courseSlugs).toContain("ai-prompt-mastery");
  });

  it("sitemap slugs include only published courses", async () => {
    const slugs = await publishedCourseSlugs();
    expect(slugs).toContain("ai-prompt-mastery");
    expect(slugs).not.toContain("digital-marketing");
  });
});
