// Homepage (Phase 1 full section stack). Server component. LCP-conscious: text hero, no heavy media.
// Order: Hero → Trust → Why GoSkilled → Learn→Earn → Courses → Packages teaser → Founding Batch
//        → FAQ → Final CTA → Footer.
// BLOCKED (documented): Founder-story section (founder bio/photo) and a Testimonials section (D-29
// forbids fake testimonials; no real users yet) — the honest Founding Batch section stands in for
// social proof until real learners can be quoted with consent.
// D-29: no income claims; "we sell skills, not dreams" stated proudly. D-01: affiliate is gated.
import Link from "next/link";
import { ShieldCheck, ReceiptText, GraduationCap, BookOpen, Sparkles, Share2, HeartHandshake, Languages, Sprout } from "lucide-react";
import { listCatalogCourses, listPackages } from "../lib/catalog/queries";
import { courseStats, packagesIncludingCourse } from "../lib/catalog/shape";
import { pageMetadata } from "../lib/seo";
import { SiteHeader } from "../components/marketing/site-header";
import { SiteFooter } from "../components/marketing/site-footer";
import { CourseCard, type CourseCardData } from "../components/marketing/course-card";
import { FaqAccordion } from "../components/marketing/faq-accordion";
import { TOP_FAQS } from "../lib/marketing/faq";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export const metadata = pageMetadata({
  title: "Learn in-demand skills",
  description: "GoSkilled — practical, job-ready skills in Hinglish. GST-inclusive pricing, 48-hour refund. We sell skills, not dreams.",
  path: "/",
});

const STEPS = [
  { Icon: BookOpen, title: "Learn a skill", body: "Short, practical lessons you can finish on your phone — starting with a free preview." },
  { Icon: Sparkles, title: "Apply it", body: "Use what you learn on real, everyday work. No fluff, no filler." },
  { Icon: Share2, title: "Share it", body: "Our affiliate program activates after review — you'll be able to refer friends once it's live." },
];

// Why GoSkilled — brand canon (trust-first vs a scam-heavy market · Hinglish for Tier-2/3 · real
// skills + honest pricing). D-29-clean: no income framing anywhere.
const WHY = [
  { Icon: HeartHandshake, title: "Trust in a noisy market", body: "Online learning is full of big promises and hidden charges. We do the opposite — honest, GST-inclusive pricing and a 48-hour refund, no dark patterns." },
  { Icon: Languages, title: "Made for how you speak", body: "Lessons in simple Hinglish, built mobile-first for Tier-2 and Tier-3 India — so language is never the thing that holds you back." },
  { Icon: Sprout, title: "Real skills, not dreams", body: "We teach practical skills you can actually use. No income guarantees, no hype — just capability you build at your own pace." },
];

export default async function HomePage() {
  const [courses, packages] = await Promise.all([listCatalogCourses(), listPackages()]);
  const featured: CourseCardData[] = courses.slice(0, 2).map((c) => {
    const s = courseStats(c.modules);
    return {
      slug: c.slug, title: c.title, summary: c.summary, category: c.category, status: c.status,
      lessonCount: s.lessonCount, durationLabel: s.durationLabel, packageNames: packagesIncludingCourse(c.slug, packages),
    };
  });

  return (
    <>
      <SiteHeader />
      <main>
        {/* 1. Hero — the one signature moment (CSS aurora + staged entrance; reduced-motion safe) */}
        <section className="hero-aurora">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
            {/* COPY: draft — brand tagline (approved) + safe subline (no income claim, D-29) */}
            <h1 className="enter font-heading text-5xl font-extrabold leading-[1.05] text-charcoal sm:text-6xl">
              Seekho.<br />Badho.<br /><span className="text-brand-gradient">Kamao.</span>
            </h1>
            <p className="enter enter-2 mt-5 max-w-lg text-lg text-charcoal/70">
              Practical, job-ready skills in simple Hinglish — learn at your own pace, right from your phone.
            </p>
            <div className="enter enter-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="sm:w-56"><Link href="/packages"><Button>Explore packages</Button></Link></div>
              <div className="sm:w-40"><Link href="/login"><Button variant="ghost">Log in</Button></Link></div>
            </div>
          </div>
        </section>

        {/* 2. Trust strip */}
        <section aria-label="Why trust us" className="border-y border-charcoal/10 bg-white">
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <Trust Icon={GraduationCap} title="Built by Ashish" body="Founder, IIM Rohtak" />
            <Trust Icon={ShieldCheck} title="48-hour refund" body="No questions asked" />
            <Trust Icon={ReceiptText} title="GST invoice" body="Price is final — no hidden charges" />
            {/* D-29, stated proudly */}
            <Trust Icon={Sparkles} title="No income guarantees" body="We sell skills, not dreams" />
          </div>
        </section>

        {/* 3. Why GoSkilled (new) */}
        <section aria-labelledby="why" className="reveal mx-auto w-full max-w-5xl px-4 py-16">
          <div className="mb-6 max-w-2xl">
            <h2 id="why" className="font-heading text-2xl font-bold sm:text-3xl">Why GoSkilled</h2>
            <p className="mt-2 text-muted">We built GoSkilled to be the honest option in a crowded, over-promising market.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHY.map(({ Icon, title, body }) => (
              <Card key={title} className="h-full">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand" aria-hidden>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-lg font-bold">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 4. Learn → Earn explainer */}
        <section aria-labelledby="how" className="reveal bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-14">
            <h2 id="how" className="mb-6 font-heading text-2xl font-bold">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ Icon, title, body }, i) => (
                <Card key={title} className="h-full">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-heading text-lg font-bold">{i + 1}. {title}</p>
                  <p className="mt-1 text-sm text-muted">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Featured courses */}
        <section aria-labelledby="featured" className="reveal mx-auto w-full max-w-5xl px-4 py-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="featured" className="font-heading text-2xl font-bold">Featured courses</h2>
            <Link href="/courses" className="text-sm font-semibold text-brand">All courses →</Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featured.map((c) => <CourseCard key={c.slug} course={c} />)}
            </div>
          ) : (
            <Card className="text-center text-muted">Courses are being set up — <Link href="/webinar" className="font-semibold text-brand">join a free webinar</Link> in the meantime.</Card>
          )}
        </section>

        {/* 6. Packages teaser */}
        <section aria-labelledby="packages-teaser" className="reveal mx-auto w-full max-w-5xl px-4 py-16">
          <Card className="flex flex-col items-center gap-4 bg-brand text-center text-brand-fg">
            <h2 id="packages-teaser" className="font-heading text-2xl font-bold">One price. GST included. No hidden charges.</h2>
            <p className="max-w-md text-brand-fg">Pick a single course, or get everything plus future releases with Career Booster.</p>
            <div className="w-full max-w-xs">
              <Link href="/packages"><Button variant="outline" className="border-brand-fg/50 text-brand-fg hover:bg-white/15">See packages</Button></Link>
            </div>
          </Card>
        </section>

        {/* 7. Founding Batch (new) — honest social-proof stand-in (D-29: no fake testimonials) */}
        <section aria-labelledby="founding" className="reveal bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-bold text-charcoal">Founding Batch</span>
                <h2 id="founding" className="mt-3 font-heading text-2xl font-bold sm:text-3xl">You&apos;re early — and that&apos;s the point</h2>
                {/* COPY: honest — we don't have testimonials yet, and we say so */}
                <p className="mt-3 text-muted">
                  GoSkilled is new. We won&apos;t show you stock photos or made-up success stories — we don&apos;t have
                  a wall of testimonials yet, and we&apos;d rather earn yours. Join the founding batch of learners,
                  get in at the ground floor, and help shape what we build next.
                </p>
              </div>
              <Card className="bg-brand/5">
                <ul className="space-y-3 text-sm text-charcoal/80">
                  <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> Be among the first learners on the platform</li>
                  <li className="flex items-start gap-2"><Share2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> Your feedback directly shapes new courses and features</li>
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> Same honest pricing and 48-hour refund — no early-bird gimmicks</li>
                </ul>
                <div className="mt-5 max-w-xs">
                  <Link href="/packages"><Button>Join the founding batch</Button></Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 8. FAQ (new) — top questions + link to the full page */}
        <section aria-labelledby="home-faq" className="reveal mx-auto w-full max-w-3xl px-4 py-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="home-faq" className="font-heading text-2xl font-bold">Common questions</h2>
            <Link href="/faq" className="text-sm font-semibold text-brand">All FAQs →</Link>
          </div>
          <FaqAccordion items={TOP_FAQS} />
        </section>

        {/* 9. Final CTA band (new) — one primary action */}
        <section aria-label="Get started" className="reveal bg-white">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Start learning a real skill today</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">Honest pricing, a 48-hour refund, and lessons built for your phone. Pick a package and begin.</p>
            <div className="mx-auto mt-6 max-w-xs">
              <Link href="/packages"><Button>Explore packages</Button></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Trust({ Icon, title, body }: { Icon: typeof ShieldCheck; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand" aria-hidden><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </div>
    </div>
  );
}
