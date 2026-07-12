// Reserved course slugs (Command_Center_Spec §4.3). The in-app browse routes live at
// /dashboard/learn/browse[/*] under the same prefix as the course player's dynamic
// /dashboard/learn/[courseSlug] — Next.js gives static segments precedence, so a course slugged
// "browse" (or "webinars") would be permanently unreachable in the player. These slugs are
// therefore forbidden at the publish boundary (the only admin path that makes a course public;
// course creation itself is out of admin scope per DR-011 — seeds/migrations must respect this
// list too).
import { LEARN_STATIC_SEGMENTS } from "../nav/focus-mode";

export const RESERVED_COURSE_SLUGS: readonly string[] = LEARN_STATIC_SEGMENTS;

export function isReservedCourseSlug(slug: string): boolean {
  return RESERVED_COURSE_SLUGS.includes(slug.toLowerCase());
}

export function reservedSlugError(slug: string): string {
  return `The slug "${slug}" is reserved by the app's own routes (/dashboard/learn/${slug}) — rename the course slug before publishing.`;
}
