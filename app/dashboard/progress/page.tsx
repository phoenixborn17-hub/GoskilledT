// Progress tab (Blueprint §3 · Redesign U4) — re-skinned: per-course semicircle gauge + milestones
// + certificate (with WhatsApp share) + Guru "explain-my-gap" entry. Same data/logic; never blank.
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import {
  getEnrolledCourses,
  getCertificatesByCourse,
} from "../../../lib/lms/queries";
import { getGamification } from "../../../lib/dashboard/gamification";
import { Milestones } from "../../../components/dashboard/gamification/milestones";
import { CertificateCard } from "../../../components/dashboard/certificate-card";
import { SemicircleGauge } from "../../../components/data/semicircle-gauge";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  const [courses, certs, game] = await Promise.all([
    getEnrolledCourses(user!.id),
    getCertificatesByCourse(user!.id),
    getGamification(user!.id),
  ]);

  return (
    <section aria-labelledby="progress-heading" className="space-y-6">
      <h1
        id="progress-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        Progress &amp; Certificates
      </h1>

      {/* Milestones (GPS-M5 §2.3) — real achievements, warm next-goal (never pressure). */}
      {courses.length > 0 && (
        <Milestones
          milestones={game.milestones}
          next={game.next}
          earnedCount={game.earnedCount}
        />
      )}

      {courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Nothing to track yet"
            description="Enroll in a course to start building your progress."
            action={
              <Link href="/dashboard/learn/browse#packages">
                <Button className="w-full">Explore courses</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {courses.map((c) => (
            <Card key={c.slug}>
              <div className="flex items-center gap-5">
                <SemicircleGauge value={c.progress.percent} size={104} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-h4 font-bold text-ink">
                    {c.title}
                  </p>
                  <p className="text-small text-ink-muted">
                    {c.progress.completed} / {c.progress.total} lessons
                  </p>
                  <div className="mt-3 max-w-[10rem]">
                    <Link href={`/dashboard/learn/${c.slug}`}>
                      <Button
                        variant={
                          c.progress.percent === 100 ? "outline" : "primary"
                        }
                        className="w-full"
                      >
                        {c.progress.percent === 100
                          ? "Review"
                          : c.progress.completed === 0
                            ? "Start"
                            : "Resume"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Certificate slot (§2.4) + WhatsApp share (§2.7) — existing leak-tested component. */}
              <CertificateCard
                percent={c.progress.percent}
                certificate={certs.get(c.courseId) ?? null}
                courseTitle={c.title}
              />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
