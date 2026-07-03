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

  it("lists Digital Marketing as PUBLISHED (2nd launch course, buyable — DR-011: 2 buyable)", async () => {
    const courses = await listCatalogCourses();
    const dm = courses.find((c) => c.slug === "digital-marketing");
    expect(dm?.status).toBe("PUBLISHED");
    expect(courseStats(dm!.modules).lessonCount).toBeGreaterThanOrEqual(6);
  });

  it("lists the 5 DR-011 roadmap courses as COMING_SOON", async () => {
    const courses = await listCatalogCourses();
    for (const slug of [
      "stock-market",
      "social-media-mastery",
      "no-code-ai-website",
      "ai-content-creation",
      "personality-development",
    ]) {
      expect(courses.find((c) => c.slug === slug)?.status).toBe("COMING_SOON");
    }
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

  it("sitemap slugs include published courses only (both launch, no coming-soon)", async () => {
    const slugs = await publishedCourseSlugs();
    expect(slugs).toContain("ai-prompt-mastery");
    expect(slugs).toContain("digital-marketing");
    expect(slugs).not.toContain("stock-market"); // COMING_SOON → excluded
  });
});
