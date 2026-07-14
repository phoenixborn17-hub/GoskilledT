// /admin/catalog/[courseId] — course editor (GPS-M4 §2.5). Edit fields, add modules/lessons + video
// asset ids, publish (server enforces ≥1 module + ≥1 lesson with a video asset).
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminCourse } from "../../../../lib/admin/catalog";
import { getCourseQuizzes } from "../../../../lib/admin/quiz";
import {
  CatalogCourseEditor,
  type CourseData,
} from "../../../../components/admin/catalog-editor";
import { AdminQuizManager } from "../../../../components/admin/quiz-manager";
import { PageHeading } from "../../../../components/admin/primitives";
import { Badge } from "../../../../components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "brand" | "muted" | "gold" | "outline"> = {
  PUBLISHED: "brand",
  COMING_SOON: "gold",
  DRAFT: "muted",
};

export default async function CatalogCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getAdminCourse(courseId);
  if (!course) notFound();
  const lessonQuizzes = await getCourseQuizzes(courseId);

  return (
    <section className="space-y-5">
      <Link
        href="/admin/catalog"
        className="text-sm text-muted hover:text-ink"
      >
        ← Back to catalog
      </Link>
      <PageHeading
        title={course.title}
        action={
          <Badge variant={STATUS_VARIANT[course.status] ?? "muted"}>
            {course.status.replace("_", " ")}
          </Badge>
        }
      />
      <CatalogCourseEditor course={course as CourseData} />
      {lessonQuizzes.length > 0 && (
        <AdminQuizManager courseId={courseId} lessons={lessonQuizzes} />
      )}
    </section>
  );
}
