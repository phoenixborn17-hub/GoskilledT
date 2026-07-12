// In-app course Browse (Command_Center_Spec §4.3 · Slice 5 — the journey-break fix). Authenticated
// discovery lives INSIDE the shell: same catalog reads the marketing pages use (display-only, no
// entitlement/checkout logic), owned-vs-unowned obvious at a glance, packages section for every
// former /packages CTA (#packages). Public /courses + /packages remain the logged-OUT surfaces.
// Honest: real catalog only, COMING_SOON labeled truthfully, no invented pricing/urgency (D-29).
import Link from "next/link";
import { ArrowRight, BadgeCheck, Store } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import {
  listCatalogCourses,
  listPackages,
} from "../../../../lib/catalog/queries";
import { getEnrolledCourses } from "../../../../lib/lms/queries";
import {
  courseStats,
  packageComparison,
  priceLabel,
} from "../../../../lib/catalog/shape";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { CourseCard } from "../../../../components/cards/course-card";
import { DecisionCard } from "../../../../components/cards/decision/decision-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse" };

export default async function BrowsePage() {
  const user = await getCurrentUser();
  const [catalog, packages, enrolled] = await Promise.all([
    listCatalogCourses(),
    listPackages(),
    getEnrolledCourses(user!.id),
  ]);
  const owned = new Map(enrolled.map((c) => [c.slug, c]));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-h1 font-extrabold text-ink">Browse</h1>
        <p className="mt-1 text-body text-ink-muted">
          Every course and package — yours are marked, the rest are one honest
          price away.
        </p>
      </header>

      {/* Courses — owned first-glance distinct from unowned (§12). */}
      <section aria-label="Courses">
        <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
          Courses
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((c) => {
            const mine = owned.get(c.slug);
            const stats = courseStats(c.modules);
            const comingSoon = c.status === "COMING_SOON";

            if (mine) {
              return (
                <CourseCard
                  key={c.slug}
                  title={c.title}
                  owned
                  progress={mine.progress.percent}
                  meta={`${stats.lessonCount} lessons · ${stats.durationLabel}`}
                  action={
                    <Link href={`/dashboard/learn/${c.slug}`}>
                      <Button>
                        {mine.progress.completed > 0 ? "Resume" : "Start"}
                      </Button>
                    </Link>
                  }
                />
              );
            }
            if (comingSoon) {
              return (
                <CourseCard
                  key={c.slug}
                  title={c.title}
                  meta="Coming soon — included with Career Booster as released, no dates promised."
                  action={
                    <Link
                      href={`/dashboard/learn/browse/${c.slug}`}
                      className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
                    >
                      View details
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  }
                />
              );
            }
            return (
              <CourseCard
                key={c.slug}
                title={c.title}
                meta={`${stats.lessonCount} lessons · ${stats.durationLabel}${
                  stats.hasFreePreview ? " · Free preview" : ""
                }`}
                action={
                  <Link href={`/dashboard/learn/browse/${c.slug}`}>
                    <Button variant="outline">View course</Button>
                  </Link>
                }
              />
            );
          })}
        </div>
      </section>

      {/* Packages — the in-app home for every former /packages CTA (#packages). */}
      <section id="packages" aria-label="Packages" className="scroll-mt-20">
        <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
          Packages
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((p) => {
            const cb = p.includesFutureCourses;
            return (
              <DecisionCard
                key={p.slug}
                icon={cb ? BadgeCheck : Store}
                label={p.name}
                accent={cb ? "gold" : "green"}
                size="primary"
                badge={cb ? { label: "Best value", tone: "new" } : undefined}
                cta={`Get ${p.name}`}
                href={`/checkout?package=${p.slug}`}
              >
                <div>
                  <p className="dc-number text-h1 font-bold text-ink">
                    {priceLabel(p.priceInPaise)}
                    <span className="dc-unit"> one-time</span>
                  </p>
                  <p className="mt-2 text-small text-ink-muted">
                    {cb
                      ? "Both launch courses + future courses as they release — honestly labeled, no dates promised."
                      : "One launch course of your choice — pick it at checkout."}
                  </p>
                </div>
              </DecisionCard>
            );
          })}
        </div>

        <PackageTable packages={packages} />

        <p className="mt-4 text-caption text-ink-muted">
          One price, no hidden charges · 48-hour refund window · instant access
          after payment.
        </p>
      </section>
    </div>
  );
}

function PackageTable({
  packages,
}: {
  packages: Awaited<ReturnType<typeof listPackages>>;
}) {
  const sb = packages.find((p) => p.slug === "skill-builder");
  const cb = packages.find((p) => p.slug === "career-booster");
  if (!sb || !cb) return null; // honest: no fabricated comparison without both real packages
  const rows = packageComparison(sb, cb);
  return (
    <div className="mt-4 overflow-x-auto rounded-gs-lg border border-line bg-surface-raised">
      <table className="w-full text-left text-small">
        <caption className="sr-only">
          Skill Builder vs Career Booster comparison
        </caption>
        <thead>
          <tr className="border-b border-line text-caption uppercase tracking-wide text-ink-muted">
            <th scope="col" className="px-4 py-3 font-semibold">
              What you get
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {sb.name}
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {cb.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature} className="border-b border-line last:border-0">
              <th scope="row" className="px-4 py-3 font-medium text-ink">
                {r.feature}
                {r.highlight && (
                  <span className="ml-2 align-middle">
                    <Badge variant="gold">Key</Badge>
                  </span>
                )}
              </th>
              <td className="px-4 py-3 tabular-nums text-ink-muted">
                {r.skillBuilder}
              </td>
              <td className="px-4 py-3 tabular-nums text-ink-muted">
                {r.careerBooster}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
