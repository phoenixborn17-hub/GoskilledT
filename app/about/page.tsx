// /about — mission + values are canon (ready to build). Founder story + photo is FOUNDER CONTENT
// REQUIRED: the layout slot is built below but gated on `FOUNDER` (null until the founder supplies
// a real bio + photo). We render NOTHING incomplete — no placeholder bio, no stock photo (DR-027:
// implementation never invents; D-29: honesty as identity).
import Link from "next/link";
import { Eye, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const metadata = pageMetadata({
  title: "About GoSkilled",
  description: "GoSkilled exists to make potential visible — practical, honest skill-learning for Tier-2/3 India. Skills, not dreams.",
  path: "/about",
});

// FOUNDER CONTENT REQUIRED — set to a real bio + photo to unblock the founder section. Until then
// the section renders nothing (see the guarded block below).
const FOUNDER: { name: string; role: string; bio: string; photo: string } | null = null;

const VALUES = [
  { Icon: ShieldCheck, title: "Trust first", body: "Money is involved, so we earn trust the hard way — radical transparency, honest pricing, and no dark patterns. Ever." },
  { Icon: Sparkles, title: "Skills, not dreams", body: "We teach practical, job-ready skills. We make no income promises and no guarantees — just real capability you can use." },
  { Icon: HandHeart, title: "Built for Bharat", body: "Made mobile-first and in simple Hinglish, for learners in Tier-2 and Tier-3 India who've been overlooked for too long." },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Mission hero */}
        <section className="hero-aurora">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:py-20">
            <span className="enter inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand-deep">
              <Eye className="h-4 w-4" aria-hidden /> Our mission
            </span>
            {/* COPY: mission is brand canon */}
            <h1 className="enter enter-2 mt-4 font-heading text-4xl font-extrabold leading-[1.1] sm:text-5xl">
              Making <span className="text-brand-gradient">Potential Visible</span>
            </h1>
            <p className="enter enter-3 mx-auto mt-4 max-w-2xl text-lg text-muted">
              Millions of talented Indians never get a fair shot — not for lack of ability, but for lack of access.
              GoSkilled exists to change that: practical skills, taught honestly, in a language that feels like home.
            </p>
          </div>
        </section>

        {/* What GoSkilled is */}
        <section aria-labelledby="what" className="reveal mx-auto w-full max-w-3xl px-4 py-14">
          <h2 id="what" className="font-heading text-2xl font-bold">What GoSkilled is</h2>
          <div className="mt-4 space-y-4 text-charcoal/80">
            <p>
              GoSkilled is a practical skill-learning platform built for mobile-first India. Short, focused lessons
              in simple Hinglish, designed to be finished on a budget phone — so learning fits into a real, busy day.
            </p>
            <p>
              We keep pricing honest and GST-inclusive, back every purchase with a 48-hour refund, and never sell
              hype. What you learn is meant to be used — at work, in a side project, in real life.
            </p>
          </div>
        </section>

        {/* The goal — Constitution Art 2 fact (public-safe phrasing, no internal codes) */}
        <section aria-label="Our goal" className="reveal bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
            <p className="font-heading text-3xl font-extrabold text-brand sm:text-4xl">10 million skilled Indians by 2035</p>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              That&apos;s the goal we&apos;re building toward — one learner, one real skill at a time.
            </p>
          </div>
        </section>

        {/* Values */}
        <section aria-labelledby="values" className="reveal mx-auto w-full max-w-5xl px-4 py-14">
          <h2 id="values" className="mb-6 font-heading text-2xl font-bold">What we stand for</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ Icon, title, body }) => (
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

        {/* Founder story — BLOCKED slot (FOUNDER CONTENT). Renders only when FOUNDER is supplied. */}
        {FOUNDER && (
          <section aria-labelledby="founder" className="reveal bg-white">
            <div className="mx-auto w-full max-w-3xl px-4 py-14">
              <h2 id="founder" className="mb-6 font-heading text-2xl font-bold">Meet the founder</h2>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FOUNDER.photo} alt={FOUNDER.name} className="h-28 w-28 rounded-2xl object-cover" />
                <div>
                  <p className="font-heading text-lg font-bold">{FOUNDER.name}</p>
                  <p className="text-sm text-brand">{FOUNDER.role}</p>
                  <p className="mt-3 text-charcoal/80">{FOUNDER.bio}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="reveal mx-auto w-full max-w-3xl px-4 py-16">
          <Card className="flex flex-col items-center gap-3 bg-brand text-center text-brand-fg">
            <h2 className="font-heading text-2xl font-bold">Ready to start?</h2>
            <p className="max-w-md text-brand-fg">Pick a skill and learn at your own pace — with honest pricing and a 48-hour refund.</p>
            <div className="w-full max-w-xs">
              <Link href="/courses"><Button variant="outline" className="border-brand-fg/50 text-brand-fg hover:bg-white/15">Explore courses</Button></Link>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
