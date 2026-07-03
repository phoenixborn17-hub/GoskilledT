// Homepage (Ticket 5, Task 4). Server component. LCP-conscious: text hero, no heavy media.
// Sections: hero → trust strip → featured courses → learn/earn explainer → packages teaser → footer.
// D-29: no income claims; "we sell skills, not dreams" stated proudly. D-01: affiliate is gated.
import Link from "next/link";
import { ShieldCheck, ReceiptText, GraduationCap, BookOpen, Sparkles, Share2 } from "lucide-react";
import { listCatalogCourses, listPackages } from "../lib/catalog/queries";
import { courseStats, packagesIncludingCourse } from "../lib/catalog/shape";
import { pageMetadata } from "../lib/seo";
import { SiteHeader } from "../components/marketing/site-header";
import { SiteFooter } from "../components/marketing/site-footer";
import { CourseCard, type CourseCardData } from "../components/marketing/course-card";
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
        {/* 1. Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
          {/* COPY: draft — brand tagline (approved) + safe subline (no income claim, D-29) */}
          <h1 className="font-heading text-5xl font-extrabold leading-[1.05] text-charcoal sm:text-6xl">
            Seekho.<br />Badho.<br />Kamao.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-charcoal/70">
            Practical, job-ready skills in simple Hinglish — learn at your own pace, right from your phone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-56"><Link href="/packages"><Button>Explore packages</Button></Link></div>
            <div className="sm:w-40"><Link href="/login"><Button variant="ghost">Log in</Button></Link></div>
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

        {/* 3. Featured courses */}
        <section aria-labelledby="featured" className="reveal mx-auto w-full max-w-5xl px-4 py-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="featured" className="font-heading text-2xl font-bold">Featured courses</h2>
            <Link href="/courses" className="text-sm font-semibold text-brand">All courses →</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((c) => <CourseCard key={c.slug} course={c} />)}
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
                  <p className="mt-1 text-sm text-charcoal/60">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Packages teaser */}
        <section aria-labelledby="packages-teaser" className="reveal mx-auto w-full max-w-5xl px-4 py-16">
          <Card className="flex flex-col items-center gap-4 bg-brand text-center text-brand-fg">
            <h2 id="packages-teaser" className="font-heading text-2xl font-bold">One price. GST included. No hidden charges.</h2>
            <p className="max-w-md text-brand-fg/90">Pick a single course, or get everything plus future releases with Career Booster.</p>
            <div className="w-full max-w-xs">
              <Link href="/packages"><Button variant="outline" className="border-brand-fg/40 bg-white/10 text-brand-fg hover:bg-white/20">See packages</Button></Link>
            </div>
          </Card>
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
        <p className="text-xs text-charcoal/55">{body}</p>
      </div>
    </div>
  );
}
