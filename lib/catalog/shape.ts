// Pure catalog display-shaping (Ticket 5). No DB, no framework — testable. Turns raw course/
// package rows into the shapes the marketing pages render. Money stays in PAISE; these are
// display formatters only (no money rules — those live in modules/, untouched).

export interface LessonLite {
  durationSec: number;
  isFreePreview: boolean;
}
export interface ModuleLite {
  lessons: LessonLite[];
}
export interface CourseStats {
  lessonCount: number;
  totalDurationSec: number;
  durationLabel: string;
  hasFreePreview: boolean;
}

/** "45 min" / "1h" / "1h 20m". */
export function formatDuration(totalSec: number): string {
  const min = Math.round(totalSec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function courseStats(modules: ModuleLite[]): CourseStats {
  const lessons = modules.flatMap((m) => m.lessons);
  const totalDurationSec = lessons.reduce((s, l) => s + l.durationSec, 0);
  return {
    lessonCount: lessons.length,
    totalDurationSec,
    durationLabel: formatDuration(totalDurationSec),
    hasFreePreview: lessons.some((l) => l.isFreePreview),
  };
}

/** GST-inclusive single price, whole rupees when exact (DR-023). ₹1,499 not ₹1,499.00. */
export function priceLabel(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: rupees % 1 === 0 ? 0 : 2 })}`;
}

export interface PackageLite {
  slug: string;
  name: string;
  priceInPaise: number;
  includesFutureCourses: boolean;
}
export interface ComparisonRow {
  feature: string;
  skillBuilder: string;
  careerBooster: string;
  highlight?: boolean;
}

/** Skill Builder vs Career Booster comparison (DR-021 composition, DR-023/025 facts). */
export function packageComparison(
  sb: PackageLite,
  cb: PackageLite,
): ComparisonRow[] {
  return [
    {
      feature: "Launch courses",
      skillBuilder: "1 course of your choice",
      careerBooster: "Both launch courses",
    },
    {
      feature: "Future courses",
      skillBuilder: "Not included",
      careerBooster: "Included as released",
      highlight: true,
    },
    {
      feature: "Price (GST-inclusive)",
      skillBuilder: priceLabel(sb.priceInPaise),
      careerBooster: priceLabel(cb.priceInPaise),
    },
    {
      feature: "Refund window",
      skillBuilder: "48 hours",
      careerBooster: "48 hours",
    },
    {
      feature: "GST",
      skillBuilder: "Included — no hidden charges",
      careerBooster: "Included — no hidden charges",
    },
    {
      feature: "Access after payment",
      skillBuilder: "Instant (under 60s)",
      careerBooster: "Instant (under 60s)",
    },
  ];
}

/** Names of active packages that include a given course (for price context on a course page). */
export function packagesIncludingCourse(
  courseSlug: string,
  packages: { name: string; courseSlugs: string[] }[],
): string[] {
  return packages
    .filter((p) => p.courseSlugs.includes(courseSlug))
    .map((p) => p.name);
}

/** Distinct, sorted categories from a course list (for the /courses filter). */
export function courseCategories(
  courses: { category: string | null }[],
): string[] {
  return [
    ...new Set(courses.map((c) => c.category).filter((c): c is string => !!c)),
  ].sort();
}
