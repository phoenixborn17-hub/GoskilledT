// /courses/[slug] — course detail (Ticket 5, Task 2) + Course JSON-LD (Task 5). Server, read-only.
// PUBLISHED → full curriculum + checkout CTA. COMING_SOON → honest "coming soon" → packages.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Lock, PlayCircle, CheckCircle2 } from "lucide-react";
import { getCourseDetail, listPackages } from "../../../lib/catalog/queries";
import {
  formatDuration,
  courseStats,
  packagesIncludingCourse,
  priceLabel,
} from "../../../lib/catalog/shape";
import { pageMetadata, siteUrl, SITE_NAME } from "../../../lib/seo";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { Card, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { TrustTriad } from "../../../components/marketing/trust-triad";

// COPY: draft — outcomes are placeholders; Fable rewrites final copy.
const OUTCOMES = [
  "Understand the core concepts from the ground up",
  "Apply what you learn to real, everyday work tasks",
  "Build confidence with hands-on, practical examples",
  "Finish with a clear next step for your goals",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseDetail(slug);
  if (!course) return { title: "Course not found" };
  return pageMetadata({
    title: course.title,
    description:
      course.summary ??
      `Learn ${course.title} with GoSkilled — practical, job-ready skills.`,
    path: `/courses/${course.slug}`,
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, packages] = await Promise.all([
    getCourseDetail(slug),
    listPackages(),
  ]);
  if (!course) notFound();

  const comingSoon = course.status === "COMING_SOON";
  const stats = courseStats(course.modules);
  const inPackages = packagesIncludingCourse(course.slug, packages);
  const sb = packages.find((p) => p.slug === "skill-builder");
  const cb = packages.find((p) => p.slug === "career-booster");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary ?? undefined,
    provider: { "@type": "Organization", name: SITE_NAME, sameAs: siteUrl() },
    url: `${siteUrl()}/courses/${course.slug}`,
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {course.category && <Badge variant="brand">{course.category}</Badge>}
          {comingSoon && <Badge variant="gold">Coming soon</Badge>}
        </div>
        <h1 className="font-heading text-3xl font-extrabold leading-tight">
          {course.title}
        </h1>
        {course.summary && (
          <p className="mt-2 text-lg text-charcoal/70">{course.summary}</p>
        )}
        {stats.lessonCount > 0 && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-4 w-4" aria-hidden /> {stats.lessonCount}{" "}
              lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden /> {stats.durationLabel}
            </span>
          </div>
        )}

        {/* Outcomes */}
        <section aria-labelledby="outcomes" className="reveal mt-8">
          <h2 id="outcomes" className="font-heading text-xl font-bold">
            What you&apos;ll learn
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {OUTCOMES.map((o) => (
              <li
                key={o}
                className="flex items-start gap-2 text-sm text-charcoal/70"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  aria-hidden
                />{" "}
                {o}
              </li>
            ))}
          </ul>
        </section>

        {/* Curriculum */}
        <section aria-labelledby="curriculum" className="reveal mt-8">
          <h2 id="curriculum" className="font-heading text-xl font-bold">
            Curriculum
          </h2>
          {course.modules.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {/* COPY: draft */}Lessons are being prepared — check back soon.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {course.modules.map((m) => (
                <div key={m.id}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {m.title}
                  </p>
                  <ul className="divide-y divide-charcoal/5 rounded-xl border border-charcoal/10">
                    {m.lessons.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-3 px-4 py-3 text-sm"
                      >
                        {l.isFreePreview ? (
                          <PlayCircle
                            className="h-4 w-4 shrink-0 text-brand"
                            aria-hidden
                          />
                        ) : (
                          <Lock
                            className="h-4 w-4 shrink-0 text-charcoal/30"
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {l.title}
                        </span>
                        {l.isFreePreview && (
                          <Link
                            href={`/dashboard/learn/${course.slug}?lesson=${l.id}`}
                            className="shrink-0 text-xs font-semibold text-brand"
                          >
                            Watch free →
                          </Link>
                        )}
                        <span className="shrink-0 text-xs text-muted">
                          {formatDuration(l.durationSec)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Instructor (placeholder) */}
        <section aria-labelledby="instructor" className="reveal mt-8">
          <h2 id="instructor" className="font-heading text-xl font-bold">
            Your instructor
          </h2>
          <Card className="mt-3 flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-lg font-bold text-brand"
              aria-hidden
            >
              A
            </div>
            <div>
              {/* COPY: draft */}
              <p className="font-semibold">Ashish · Founder, GoSkilled</p>
              <p className="text-sm text-muted">
                IIM Rohtak. Teaches practical, no-fluff skills for real work.
              </p>
            </div>
          </Card>
        </section>

        {/* Price context + CTA */}
        <section aria-labelledby="pricing" className="reveal mt-8">
          <h2 id="pricing" className="font-heading text-xl font-bold">
            How to get access
          </h2>
          <Card className="mt-3">
            {comingSoon ? (
              <>
                {/* COPY: draft — DR-021 honest labeling */}
                <CardTitle className="text-lg">Coming soon</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  This course isn&apos;t available yet.{" "}
                  <strong>Career Booster</strong> includes future courses as
                  they&apos;re released
                  {cb ? ` — ${priceLabel(cb.priceInPaise)}, GST-inclusive` : ""}
                  .
                </p>
                <div className="mt-4 max-w-xs">
                  <Link href="/packages">
                    <Button>See packages</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-charcoal/70">
                  {/* COPY: draft — DR-023 GST-inclusive */}
                  Included in{" "}
                  {inPackages.length > 0
                    ? inPackages.join(" & ")
                    : "our packages"}
                  .
                  {sb &&
                    cb &&
                    ` Skill Builder ${priceLabel(sb.priceInPaise)} (pick one course) or Career Booster ${priceLabel(cb.priceInPaise)} (both + future). GST-inclusive, no hidden charges.`}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <div className="sm:w-56">
                    <Link href="/checkout?package=career-booster">
                      <Button>Get started</Button>
                    </Link>
                  </div>
                  <div className="sm:w-48">
                    <Link href="/packages">
                      <Button variant="outline">Compare packages</Button>
                    </Link>
                  </div>
                </div>
                {/* Trust triad AT the Buy CTA (Amendments §G · DESIGN §14). */}
                <TrustTriad className="mt-4" />
              </>
            )}
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
