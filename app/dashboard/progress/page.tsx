// Progress tab (Blueprint §3): per-course progress with a Resume action. Never blank.
import Link from "next/link";
import { getCurrentUser } from "../../../lib/auth/session";
import { getEnrolledCourses } from "../../../lib/lms/queries";
import { ProgressRing } from "../../../components/dashboard/progress-ring";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  const courses = await getEnrolledCourses(user!.id);

  return (
    <section aria-labelledby="progress-heading" className="space-y-6">
      <h1 id="progress-heading" className="font-heading text-2xl font-bold">Progress</h1>

      {courses.length === 0 ? (
        <Card className="text-center">
          <CardTitle>Nothing to track yet</CardTitle>
          <CardDescription>Enroll in a course to start building your progress.</CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/checkout?package=career-booster"><Button>Explore courses</Button></Link>
          </div>
        </Card>
      ) : (
        courses.map((c) => (
          <Card key={c.slug} className="flex items-center gap-5">
            <ProgressRing percent={c.progress.percent} size={80} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-bold">{c.title}</p>
              <p className="text-sm text-charcoal/60">{c.progress.completed} / {c.progress.total} lessons</p>
              <div className="mt-3 max-w-[10rem]">
                <Link href={`/dashboard/learn/${c.slug}`}>
                  <Button variant={c.progress.percent === 100 ? "outline" : "primary"}>
                    {c.progress.percent === 100 ? "Review" : c.progress.completed === 0 ? "Start" : "Resume"}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))
      )}
    </section>
  );
}
