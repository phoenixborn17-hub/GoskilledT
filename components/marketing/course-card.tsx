// Course card (server component). Honest about COMING_SOON — no fake availability.
import Link from "next/link";
import { Clock, PlayCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export interface CourseCardData {
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  status: "PUBLISHED" | "COMING_SOON" | "DRAFT";
  lessonCount: number;
  durationLabel: string;
  packageNames: string[]; // packages that include this course (price context)
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const comingSoon = course.status === "COMING_SOON";
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-2xl"
    >
      <Card className="lift flex h-full flex-col gap-3 transition-colors hover:border-brand/30">
        <div className="flex items-center justify-between gap-2">
          {course.category && <Badge variant="brand">{course.category}</Badge>}
          {comingSoon && <Badge variant="gold">Coming soon</Badge>}
        </div>

        <h3 className="font-heading text-lg font-bold leading-snug">
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
          {/* COPY: draft — price context (DR-023 package pricing) */}
          <p className="text-xs text-muted">
            {course.packageNames.length > 0
              ? `Included in ${course.packageNames.join(" & ")}`
              : "Available in our packages"}
          </p>
          <span className="inline-block text-sm font-semibold text-brand">
            {comingSoon ? "Preview details →" : "View course →"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
