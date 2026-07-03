// Enrollment fan-out — DR-021 packaging.
// Skill Builder = 1 launch course (buyer's choice). Career Booster = all package courses
// (+ future courses as released — handled by includesFutureCourses at course-publish time).

export interface PackageDef {
  slug: "skill-builder" | "career-booster";
  includesFutureCourses: boolean;
  courseIds: string[]; // current PackageCourse rows
}

export type EntitlementResult =
  { ok: true; courseIds: string[] } | { ok: false; reason: string };

export function coursesToEnroll(
  pkg: PackageDef,
  chosenCourseId?: string | null,
): EntitlementResult {
  if (pkg.slug === "skill-builder") {
    if (!chosenCourseId)
      return {
        ok: false,
        reason: "Skill Builder requires a course choice (DR-021)",
      };
    if (!pkg.courseIds.includes(chosenCourseId))
      return {
        ok: false,
        reason: "Chosen course is not in the Skill Builder package",
      };
    return { ok: true, courseIds: [chosenCourseId] };
  }
  // Career Booster: everything currently in the package.
  if (pkg.courseIds.length === 0)
    return { ok: false, reason: "Package has no courses configured" };
  return { ok: true, courseIds: [...pkg.courseIds] };
}

/** When a NEW course is published: which existing customers get it automatically? */
export function autoEnrollOnPublish(pkg: PackageDef): boolean {
  return pkg.includesFutureCourses; // true for Career Booster (DR-021)
}
