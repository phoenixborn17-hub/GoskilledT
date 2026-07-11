// Course card (server component). Honest about COMING_SOON — no fake availability. Premium surface:
// category + status row, gradient skill glyph, meta, and an honest "Free preview" signal when a
// lesson is genuinely free (D-29 — real flags only). Used on Home + /courses.
import Link from "next/link";
import { Clock, PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export interface CourseCardData {
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  status: "PUBLISHED" | "COMING_SOON" | "DRAFT";
  lessonCount: number;
  durationLabel: string;
  packageNames: string[]; // packages that include this course (price context)
  hasFreePreview?: boolean; // real flag only — never fabricated
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const comingSoon = course.status === "COMING_SOON";
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <article
        className={cn(
          "lift flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-gs-sm transition-colors hover:border-brand/30",
        )}
      >
        {/* Cover band — brand gradient wash + category glyph (no stock photos, DESIGN §9). */}
        <div className="relative flex h-24 items-end justify-between overflow-hidden bg-gradient-to-br from-brand/[0.10] via-brand/[0.05] to-gold/[0.06] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            {course.category && (
              <Badge variant="brand">{course.category}</Badge>
            )}
          </div>
          {comingSoon ? (
            <Badge variant="gold">Coming soon</Badge>
          ) : course.hasFreePreview ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-brand-deep">
              <Sparkles className="h-3 w-3" aria-hidden /> Free preview
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="font-heading text-lg font-bold leading-snug text-charcoal">
            {course.title}
          </h3>
          {course.summary && (
            <p className="line-clamp-2 text-sm text-muted">{course.summary}</p>
          )}

          <div className="mt-auto space-y-2 pt-2">
            {course.lessonCount > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <PlayCircle className="h-3.5 w-3.5" aria-hidden />{" "}
                  {course.lessonCount} lessons
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />{" "}
                  {course.durationLabel}
                </span>
              </div>
            )}
            <p className="text-xs text-muted">
              {course.packageNames.length > 0
                ? `Included in ${course.packageNames.join(" & ")}`
                : "Available in our packages"}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
              {comingSoon ? "Preview details" : "View course"}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
