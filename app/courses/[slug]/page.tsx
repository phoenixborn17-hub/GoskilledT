// /courses/[slug] — course detail (Ticket 5, Task 2) + Course JSON-LD. Server, read-only.
// PUBLISHED → full curriculum + checkout CTA. COMING_SOON → honest "coming soon" → packages.
// Re-skinned to the Public Experience standard (kit + shell + sticky buy card); logic unchanged.
// Signature moment: the learning-timeline curriculum with a verifiable-certificate preview.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Clock,
  Lock,
  PlayCircle,
  CheckCircle2,
  Award,
  Smartphone,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { getCourseDetail, listPackages } from "../../../lib/catalog/queries";
import {
  formatDuration,
  courseStats,
  packagesIncludingCourse,
  priceLabel,
} from "../../../lib/catalog/shape";
import { pageMetadata, siteUrl, SITE_NAME } from "../../../lib/seo";
import { MarketingShell } from "../../../components/marketing/marketing-shell";
import { Container } from "../../../components/marketing/kit";
import { Monogram } from "../../../components/marketing/monogram";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { TrustTriad } from "../../../components/marketing/trust-triad";

// COPY: draft — honest capability outcomes (NO income/earning promise, D-29). Founder finalises.
const OUTCOMES = [
  "Understand the core concepts from the ground up",
  "Apply what you learn to real, everyday work tasks",
  "Build confidence with hands-on, practical examples",
  "Finish with a clear, practical next step",
];

// Per-course FAQ (objection-removal). Honest, package-fact accurate.
const COURSE_FAQ = [
  {
    q: "Do I need any prior experience?",
    a: "No. Every course starts from the basics and builds up step by step, in simple Hinglish.",
  },
  {
    q: "Can I learn on my phone?",
    a: "Yes — every lesson is built mobile-first, so you can learn on any phone, at your own pace.",
  },
  {
    q: "Is there a refund if it's not for me?",
    a: "Yes. Full refund within 48 hours of purchase, no questions asked. One price, no hidden charges.",
  },
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
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero band */}
      <section className="hero-aurora">
        <Container className="py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <Link href="/courses" className="hover:text-brand">
              Courses
            </Link>
            <span aria-hidden> / </span>
            <span className="text-ink/70">
              {course.category ?? "Course"}
            </span>
          </nav>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {course.category && (
              <Badge variant="brand">{course.category}</Badge>
            )}
            {comingSoon ? (
              <Badge variant="gold">Coming soon</Badge>
            ) : (
              stats.hasFreePreview && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-brand-deep">
                  <PlayCircle className="h-3.5 w-3.5" aria-hidden /> Free
                  preview
                </span>
              )
            )}
          </div>
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {course.title}
          </h1>
          {course.summary && (
            <p className="mt-3 max-w-2xl text-lg text-ink/70">
              {course.summary}
            </p>
          )}
          {stats.lessonCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" aria-hidden />{" "}
                {stats.lessonCount} lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden /> {stats.durationLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="h-4 w-4" aria-hidden /> Certificate on
                completion
              </span>
            </div>
          )}
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-3">
        {/* Left: content */}
        <main className="lg:col-span-2">
          {/* What you'll learn */}
          <section aria-labelledby="outcomes" className="reveal">
            <h2
              id="outcomes"
              className="font-heading text-xl font-bold text-ink"
            >
              What you&apos;ll learn
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {OUTCOMES.map((o) => (
                <li
                  key={o}
                  className="flex items-start gap-2.5 text-sm text-ink/80"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                    aria-hidden
                  />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          {/* Curriculum — learning timeline */}
          <section aria-labelledby="curriculum" className="reveal mt-10">
            <h2
              id="curriculum"
              className="font-heading text-xl font-bold text-ink"
            >
              Curriculum
            </h2>
            {course.modules.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Lessons are being prepared — check back soon.
              </p>
            ) : (
              <ol className="mt-5 space-y-6">
                {course.modules.map((m, mi) => (
                  <li key={m.id} className="relative pl-8">
                    {/* timeline spine + node */}
                    <span
                      aria-hidden
                      className="absolute left-[0.6875rem] top-6 h-full w-px bg-brand/15 last:hidden"
                    />
                    <span
                      aria-hidden
                      className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-brand/25 bg-surface-raised text-xs font-bold text-brand-deep"
                    >
                      {mi + 1}
                    </span>
                    <p className="font-heading text-base font-bold text-ink">
                      {m.title}
                    </p>
                    <ul className="mt-2 divide-y divide-line/5 rounded-xl border border-line/10 bg-surface-raised">
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
                              className="h-4 w-4 shrink-0 text-ink/30"
                              aria-hidden
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate text-ink/80">
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
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Certificate preview — honest (verifiable certificate is a real feature) */}
          <section aria-labelledby="certificate" className="reveal mt-10">
            <h2
              id="certificate"
              className="font-heading text-xl font-bold text-ink"
            >
              Earn a verifiable certificate
            </h2>
            <div className="mt-4 overflow-hidden rounded-gs-lg border border-brand/20 bg-gradient-to-br from-brand/[0.05] to-gold/[0.06]">
              <div className="flex items-center gap-4 p-6">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-gs-lg bg-surface-raised text-brand shadow-gs-sm ring-1 ring-gold/50"
                  aria-hidden
                >
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-heading font-bold text-ink">
                    Certificate of Completion
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Finish the course to earn a certificate with a unique serial
                    you (and anyone) can verify online. Proof of skill — never a
                    promise of income.
                  </p>
                  <Link
                    href="/verify"
                    className="mt-2 inline-block text-sm font-semibold text-brand"
                  >
                    See how verification works →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Instructor */}
          <section aria-labelledby="instructor" className="reveal mt-10">
            <h2
              id="instructor"
              className="font-heading text-xl font-bold text-ink"
            >
              Your instructor
            </h2>
            <Card className="mt-4 flex items-center gap-4">
              <Monogram name="Ashish" className="h-14 w-14 text-lg" />
              <div>
                <p className="font-semibold text-ink">
                  Ashish · Founder, GoSkilled
                </p>
                <p className="text-sm text-muted">
                  IIM Rohtak. Teaches practical, no-fluff skills for real work.
                </p>
              </div>
            </Card>
          </section>

          {/* Per-course FAQ */}
          <section aria-labelledby="course-faq" className="reveal mt-10">
            <h2
              id="course-faq"
              className="font-heading text-xl font-bold text-ink"
            >
              Common questions
            </h2>
            <div className="mt-4 space-y-2">
              {COURSE_FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-line/10 bg-surface-raised p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
                    {f.q}
                    <span
                      className="ml-2 text-brand transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>

        {/* Right: sticky buy card (desktop) */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card className="shadow-gs">
              {comingSoon ? (
                <>
                  <p className="font-heading text-lg font-bold text-ink">
                    Coming soon
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    This course isn&apos;t available yet.{" "}
                    <strong>Career Booster</strong> includes future courses as
                    they&apos;re released
                    {cb
                      ? ` — ${priceLabel(cb.priceInPaise)}, no hidden charges`
                      : ""}
                    .
                  </p>
                  <div className="mt-4">
                    <Link href="/packages">
                      <Button>See packages</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Included in{" "}
                    <span className="font-semibold text-ink">
                      {inPackages.length > 0
                        ? inPackages.join(" & ")
                        : "our packages"}
                    </span>
                  </p>
                  {sb && (
                    <p className="mt-2 text-3xl font-extrabold text-ink">
                      {priceLabel(sb.priceInPaise)}
                      <span className="ml-1 text-sm font-medium text-muted">
                        onwards · no hidden charges
                      </span>
                    </p>
                  )}
                  <ul className="mt-4 space-y-2.5 text-sm text-ink/80">
                    <Included icon={BookOpen}>
                      {stats.lessonCount} lessons · {stats.durationLabel}
                    </Included>
                    <Included icon={Award}>
                      Verifiable certificate on completion
                    </Included>
                    <Included icon={Smartphone}>
                      Learn on your phone, at your own pace
                    </Included>
                    <Included icon={ShieldCheck}>
                      48-hour refund · no hidden charges
                    </Included>
                  </ul>
                  <div className="mt-5 space-y-2">
                    <Link href="/checkout?package=career-booster">
                      <Button>Get started</Button>
                    </Link>
                    <Link href="/packages">
                      <Button variant="outline">Compare packages</Button>
                    </Link>
                  </div>
                  <TrustTriad className="mt-4 justify-center" />
                </>
              )}
            </Card>
          </div>
        </aside>
      </Container>

      {/* Sticky mobile CTA */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/10 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {sb && !comingSoon && (
            <span className="shrink-0 text-sm font-bold text-ink">
              {priceLabel(sb.priceInPaise)}+
            </span>
          )}
          <Link
            href={comingSoon ? "/packages" : "/checkout?package=career-booster"}
            className="press inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-fg"
          >
            {comingSoon ? "See packages" : "Get started"}
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}

function Included({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
