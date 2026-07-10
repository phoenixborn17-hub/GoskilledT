// Homepage (Phase 1 full section stack). Server component. LCP-conscious: text hero, no heavy media.
// Order: Hero → Trust → Why GoSkilled → Learn→Earn → Courses → Packages teaser → Founding Batch
//        → FAQ → Final CTA → Footer.
// BLOCKED (documented): Founder-story section (founder bio/photo) and a Testimonials section (D-29
// forbids fake testimonials; no real users yet) — the honest Founding Batch section stands in for
// social proof until real learners can be quoted with consent.
// D-29: no income claims; "we sell skills, not dreams" stated proudly. D-01: affiliate is gated.
import Link from "next/link";
import {
  ShieldCheck,
  ReceiptText,
  GraduationCap,
  BookOpen,
  Sparkles,
  Share2,
  HeartHandshake,
  Languages,
  Sprout,
  Lightbulb,
  Rocket,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";
import { listCatalogCourses, listPackages } from "../lib/catalog/queries";
import { courseStats, packagesIncludingCourse } from "../lib/catalog/shape";
import { buildSkillNodes } from "../lib/marketing/skill-universe";
import { pageMetadata, organizationJsonLd } from "../lib/seo";
import { JsonLd } from "../components/marketing/json-ld";
import { SiteHeader } from "../components/marketing/site-header";
import { SiteFooter } from "../components/marketing/site-footer";
import { ScrollProgress } from "../components/marketing/scroll-progress";
import { SkillUniverse } from "../components/marketing/skill-universe";
import { MobileCtaBar } from "../components/marketing/mobile-cta-bar";
import {
  CourseCard,
  type CourseCardData,
} from "../components/marketing/course-card";
import { FaqAccordion } from "../components/marketing/faq-accordion";
import { TOP_FAQS } from "../lib/marketing/faq";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export const metadata = pageMetadata({
  title: "Learn in-demand skills",
  description:
    "GoSkilled — practical, job-ready skills in Hinglish. GST-inclusive pricing, 48-hour refund. We sell skills, not dreams.",
  path: "/",
});

// Why GoSkilled — brand canon (trust-first vs a scam-heavy market · Hinglish for Tier-2/3 · real
// skills + honest pricing). D-29-clean: no income framing anywhere.
const WHY = [
  {
    Icon: HeartHandshake,
    title: "Trust in a noisy market",
    body: "Online learning is full of big promises and hidden charges. We do the opposite — honest, GST-inclusive pricing and a 48-hour refund, no dark patterns.",
  },
  {
    Icon: Languages,
    title: "Made for how you speak",
    body: "Lessons in simple Hinglish, built mobile-first for Tier-2 and Tier-3 India — so language is never the thing that holds you back.",
  },
  {
    Icon: Sprout,
    title: "Real skills, not dreams",
    body: "We teach practical skills you can actually use. No income guarantees, no hype — just capability you build at your own pace.",
  },
];

// The Learn→Grow scroll-story (charter: the visitor FEELS the journey). Honest + aspirational,
// zero income/earning mechanics on the public site (D-29) — "growth" is capability, not cash.
const JOURNEY = [
  {
    Icon: BookOpen,
    step: "Learn",
    body: "Start with a free preview. Short, practical lessons in simple Hinglish, built for your phone.",
  },
  {
    Icon: Lightbulb,
    step: "Build a skill",
    body: "Apply each lesson to real work. You finish with capability you can actually use — not just notes.",
  },
  {
    Icon: BadgeCheck,
    step: "Gain confidence",
    body: "Track your progress and earn a verifiable certificate as proof of what you've learned.",
  },
  {
    Icon: Rocket,
    step: "Open opportunities",
    body: "Real skills open real doors. We teach the capability; the momentum is yours to carry forward.",
  },
  {
    Icon: TrendingUp,
    step: "Keep growing",
    body: "New courses keep arriving. Your skill map grows with the platform — one honest step at a time.",
  },
];

export default async function HomePage() {
  const [courses, packages] = await Promise.all([
    listCatalogCourses(),
    listPackages(),
  ]);
  // ⭐ Skill Universe nodes — derived from REAL catalog categories only (honest live/soon status).
  const skillNodes = buildSkillNodes(
    courses.map((c) => ({
      slug: c.slug,
      category: c.category,
      status: c.status,
    })),
  );
  const featured: CourseCardData[] = courses.slice(0, 2).map((c) => {
    const s = courseStats(c.modules);
    return {
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      category: c.category,
      status: c.status,
      lessonCount: s.lessonCount,
      durationLabel: s.durationLabel,
      packageNames: packagesIncludingCourse(c.slug, packages),
    };
  });

  return (
    <>
      <ScrollProgress />
      <SiteHeader />
      <JsonLd data={organizationJsonLd()} />
      <main>
        {/* 1. Hero — ⭐ signature moment: the Living Skill Universe. Text + primary CTA render first
               (LCP + thumb-reach on mobile); the interactive universe sits beside it on desktop,
               below it on mobile. CSS aurora backdrop kept for depth (reduced-motion safe). */}
        <section className="hero-aurora">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:gap-8">
            <div>
              <span className="enter inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-deep">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Making potential visible
              </span>
              {/* COPY: brand tagline (approved) + safe subline explaining the model (no income, D-29) */}
              <h1 className="enter enter-2 mt-4 font-heading text-5xl font-extrabold leading-[1.05] text-charcoal sm:text-6xl">
                Seekho.
                <br />
                Badho.
                <br />
                <span className="text-brand-gradient">Kamao.</span>
              </h1>
              <p className="enter enter-2 mt-5 max-w-lg text-lg text-charcoal/70">
                Learn a real skill, build real capability, and grow — all in
                simple Hinglish, right from your phone.
              </p>
              <div className="enter enter-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="sm:w-52">
                  <Link href="/register">
                    <Button>Register free</Button>
                  </Link>
                </div>
                <div className="sm:w-52">
                  <Link href="/webinar">
                    <Button variant="outline">Join a free webinar</Button>
                  </Link>
                </div>
              </div>
              {/* Trust microline at the decision (Amendments §G) — honest, registration-true only. */}
              <ul className="enter enter-3 mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted">
                <li className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
                  Registered LLP
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <ReceiptText className="h-4 w-4 text-brand" aria-hidden />
                  GST-inclusive pricing
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-brand" aria-hidden />
                  48-hour refund
                </li>
              </ul>
            </div>

            {/* The interactive Skill Universe (client island; degrades to a static, legible network) */}
            <div className="enter enter-2">
              <SkillUniverse nodes={skillNodes} />
            </div>
          </div>
        </section>

        {/* 2. Trust strip */}
        <section
          aria-label="Why trust us"
          className="border-y border-charcoal/10 bg-white"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <Trust
              Icon={GraduationCap}
              title="Built by Ashish"
              body="Founder, IIM Rohtak"
            />
            <Trust
              Icon={ShieldCheck}
              title="48-hour refund"
              body="No questions asked"
            />
            <Trust
              Icon={ReceiptText}
              title="GST invoice"
              body="Price is final — no hidden charges"
            />
            {/* D-29, stated proudly */}
            <Trust
              Icon={Sparkles}
              title="No income guarantees"
              body="We sell skills, not dreams"
            />
          </div>
        </section>

        {/* 3. Why GoSkilled (new) */}
        <section
          aria-labelledby="why"
          className="reveal mx-auto w-full max-w-5xl px-4 py-16"
        >
          <div className="mb-6 max-w-2xl">
            <h2
              id="why"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Why GoSkilled
            </h2>
            <p className="mt-2 text-muted">
              We built GoSkilled to be the honest option in a crowded,
              over-promising market.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHY.map(({ Icon, title, body }) => (
              <Card key={title} className="h-full">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-lg font-bold">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 4. The journey — Learn → Grow scroll-story (charter). A connected path the visitor FEELS:
               vertical timeline on mobile, horizontal on desktop. Learning-first, no earn mechanics. */}
        <section aria-labelledby="journey" className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <h2
                id="journey"
                className="font-heading text-2xl font-bold sm:text-3xl"
              >
                Your journey with GoSkilled
              </h2>
              <p className="mt-2 text-muted">
                One honest path — from your first free lesson to real, lasting
                capability.
              </p>
            </div>

            <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-4">
              {/* Connecting spine — vertical on mobile, horizontal on desktop (decorative). */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[1.4rem] top-2 bottom-2 w-px bg-gradient-to-b from-brand/30 via-brand/20 to-transparent lg:left-8 lg:right-8 lg:top-8 lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r lg:from-brand/30 lg:via-brand/25 lg:to-brand/10"
              />
              {JOURNEY.map(({ Icon, step, body }, i) => (
                <li key={step} className="reveal relative flex gap-4 lg:block">
                  <div className="relative z-10 flex flex-col items-center lg:items-start">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/20 bg-white text-brand shadow-gs-sm">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <div className="lg:mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-deep">
                      Step {i + 1}
                    </p>
                    <p className="mt-0.5 font-heading text-lg font-bold text-charcoal">
                      {step}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Featured courses */}
        <section
          aria-labelledby="featured"
          className="reveal mx-auto w-full max-w-5xl px-4 py-14"
        >
          <div className="mb-5 flex items-end justify-between">
            <h2 id="featured" className="font-heading text-2xl font-bold">
              Featured courses
            </h2>
            <Link href="/courses" className="text-sm font-semibold text-brand">
              All courses →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featured.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          ) : (
            <Card className="text-center text-muted">
              Courses are being set up —{" "}
              <Link href="/webinar" className="font-semibold text-brand">
                join a free webinar
              </Link>{" "}
              in the meantime.
            </Card>
          )}
        </section>

        {/* 6. Packages teaser */}
        <section
          aria-labelledby="packages-teaser"
          className="reveal mx-auto w-full max-w-5xl px-4 py-16"
        >
          <Card className="flex flex-col items-center gap-4 bg-brand text-center text-brand-fg">
            <h2
              id="packages-teaser"
              className="font-heading text-2xl font-bold"
            >
              One price. GST included. No hidden charges.
            </h2>
            <p className="max-w-md text-brand-fg">
              Pick a single course, or get everything plus future releases with
              Career Booster.
            </p>
            <div className="w-full max-w-xs">
              <Link href="/packages">
                <Button
                  variant="outline"
                  className="border-brand-fg/50 text-brand-fg hover:bg-white/15"
                >
                  See packages
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* 7. Founding Batch (new) — honest social-proof stand-in (D-29: no fake testimonials) */}
        <section aria-labelledby="founding" className="reveal bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-bold text-charcoal">
                  Founding Batch
                </span>
                <h2
                  id="founding"
                  className="mt-3 font-heading text-2xl font-bold sm:text-3xl"
                >
                  You&apos;re early — and that&apos;s the point
                </h2>
                {/* COPY: honest — we don't have testimonials yet, and we say so */}
                <p className="mt-3 text-muted">
                  GoSkilled is new. We won&apos;t show you stock photos or
                  made-up success stories — we don&apos;t have a wall of
                  testimonials yet, and we&apos;d rather earn yours. Join the
                  founding batch of learners, get in at the ground floor, and
                  help shape what we build next.
                </p>
              </div>
              <Card className="bg-brand/5">
                <ul className="space-y-3 text-sm text-charcoal/80">
                  <li className="flex items-start gap-2">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      aria-hidden
                    />{" "}
                    Be among the first learners on the platform
                  </li>
                  <li className="flex items-start gap-2">
                    <Share2
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      aria-hidden
                    />{" "}
                    Your feedback directly shapes new courses and features
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      aria-hidden
                    />{" "}
                    Same honest pricing and a 48-hour refund
                  </li>
                </ul>
                {/* Phase 1B — verbatim. NO percentages, NO commission mentions (D-30 pending). */}
                <p className="mt-4 rounded-xl bg-gold/15 px-4 py-3 text-sm font-semibold text-charcoal">
                  Exclusive Founding Batch pricing — available to a limited
                  number of founding learners.
                </p>
                <div className="mt-5 max-w-xs">
                  <Link href="/packages">
                    <Button>Join the founding batch</Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 8. FAQ (new) — top questions + link to the full page */}
        <section
          aria-labelledby="home-faq"
          className="reveal mx-auto w-full max-w-3xl px-4 py-16"
        >
          <div className="mb-5 flex items-end justify-between">
            <h2 id="home-faq" className="font-heading text-2xl font-bold">
              Common questions
            </h2>
            <Link href="/faq" className="text-sm font-semibold text-brand">
              All FAQs →
            </Link>
          </div>
          <FaqAccordion items={TOP_FAQS} />
        </section>

        {/* 9. Final CTA band (new) — one primary action */}
        <section aria-label="Get started" className="reveal bg-white">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">
              Start learning a real skill today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Honest pricing, a 48-hour refund, and lessons built for your
              phone. Pick a package and begin.
            </p>
            <div className="mx-auto mt-6 max-w-xs">
              <Link href="/packages">
                <Button>Explore packages</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      {/* Sticky mobile CTA + a spacer so the footer's last line clears it at scroll-end. */}
      <div aria-hidden className="h-24 lg:hidden" />
      <MobileCtaBar />
    </>
  );
}

function Trust({
  Icon,
  title,
  body,
}: {
  Icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </div>
    </div>
  );
}
