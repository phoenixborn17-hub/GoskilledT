// My courses (GPS-M2 §2.2): the full entitlement view — what I own + (Career Booster) the honest
// "as released" roadmap. Server component, noindex (authenticated frame). Never blank.
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { getEnrollmentsWithRoadmap } from "../../../lib/lms/queries";
import { ProgressRing } from "../../../components/dashboard/progress-ring";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  const { enrolled, hasCareerBooster, roadmap } =
    await getEnrollmentsWithRoadmap(user!.id);

  // {/* Guru slot (GPS-M5, §1E): ask-a-doubt entry point reserved here — no UI shipped in M2. */}

  if (enrolled.length === 0) {
    return (
      <section aria-labelledby="courses-heading" className="space-y-5">
        <h1 id="courses-heading" className="font-heading text-2xl font-bold">
          My courses
        </h1>
        <Card className="text-center">
          <CardTitle>You don&apos;t own any courses yet</CardTitle>
          <CardDescription>
            Pick a package to start learning — your first lesson is a free
            preview.
          </CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/packages">
              <Button>See packages</Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="courses-heading" className="space-y-8">
      <h1 id="courses-heading" className="font-heading text-2xl font-bold">
        My courses
      </h1>

      {/* Enrolled courses */}
      <div className="grid gap-4 md:grid-cols-2">
        {enrolled.map((c) => {
          const cta =
            c.progress.percent === 100
              ? "Review"
              : c.progress.completed === 0
                ? "Start"
                : "Resume";
          return (
            <Card key={c.slug} className="flex items-center gap-4">
              <ProgressRing percent={c.progress.percent} size={72} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-bold">
                  {c.title}
                </p>
                <p className="text-sm text-muted">
                  {c.progress.completed} / {c.progress.total} lessons
                </p>
                <div className="mt-3 max-w-[9rem]">
                  <Link href={`/dashboard/learn/${c.slug}`}>
                    <Button
                      variant={
                        c.progress.percent === 100 ? "outline" : "primary"
                      }
                    >
                      {cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Career Booster: honest "as released" roadmap (DR-021). No dates promised, non-interactive. */}
      {hasCareerBooster && roadmap.length > 0 && (
        <section aria-labelledby="roadmap-heading" className="space-y-3">
          <div>
            <h2 id="roadmap-heading" className="font-heading text-lg font-bold">
              Included in your package — as released
            </h2>
            <p className="text-sm text-muted">
              Career Booster includes these courses as they&apos;re released.
              We&apos;ll add them to your account automatically — no extra
              charge, no dates promised.
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {roadmap.map((c) => (
              <li key={c.slug}>
                <Card className="flex items-start gap-3 bg-brand/5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
                    aria-hidden
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-charcoal">
                        {c.title}
                      </p>
                      <Badge variant="gold">As released</Badge>
                    </div>
                    {c.summary && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                        {c.summary}
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skill Builder: honest, upsell-free note (no dark-pattern pressure). */}
      {!hasCareerBooster && (
        <p className="text-sm text-muted">
          You&apos;re on Skill Builder — this is the course you chose. Want
          more? You can always explore{" "}
          <Link href="/packages" className="font-semibold text-brand">
            our packages
          </Link>
          .
        </p>
      )}
    </section>
  );
}
