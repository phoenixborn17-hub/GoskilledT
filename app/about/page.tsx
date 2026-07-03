// /about — Phase 1B: founder message, founding team, company facts, and "the gap" section are now
// unblocked by the frozen spec (docs/specs/PHASE_1B_CONTENT_SPEC.md). All copy is VERBATIM from the
// spec. Team avatars are branded monograms — NO photos, NO AI faces (Fable trust override); the
// layout lets real photos swap in later without a redesign.
import Link from "next/link";
import { Eye, HandHeart, ShieldCheck, Sparkles, Quote } from "lucide-react";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { Monogram } from "../../components/marketing/monogram";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const metadata = pageMetadata({
  title: "About GoSkilled",
  description:
    "GoSkilled exists to make potential visible — practical, honest skill-learning for Tier-2/3 India. Skills, not dreams.",
  path: "/about",
});

// Verbatim spec copy (do not edit — frozen).
const FOUNDER_QUOTE =
  "GoSkilled was founded with one clear vision — to make practical, industry-ready education accessible to everyone. We believe real skills create real opportunities, and learning should lead to confidence, growth, and long-term success — not unrealistic promises. Every decision we make is guided by trust, transparency, and helping learners build skills that truly matter.";
const GAP_COPY =
  "Every year, millions of students graduate with degrees but struggle to find meaningful opportunities, because the gap between education and industry keeps growing. GoSkilled was created to bridge that gap — practical skills, real confidence, honest guidance.";
const BRAND_STATEMENT =
  "We will never sell dreams. We will help you build skills that create opportunities.";

// Founding team — monogram avatars only (NO photos / NO AI faces per spec).
const TEAM = [
  { name: "Ashish Sangwal", role: "Founder & CEO" },
  { name: "Neha", role: "Co-Founder & Operations" },
  { name: "Aniket", role: "Partner" },
];

const VALUES = [
  {
    Icon: ShieldCheck,
    title: "Trust first",
    body: "Money is involved, so we earn trust the hard way — radical transparency, honest pricing, and no dark patterns. Ever.",
  },
  {
    Icon: Sparkles,
    title: "Skills, not dreams",
    body: "We teach practical, job-ready skills. We make no income promises and no guarantees — just real capability you can use.",
  },
  {
    Icon: HandHeart,
    title: "Built for Bharat",
    body: "Made mobile-first and in simple Hinglish, for learners in Tier-2 and Tier-3 India who've been overlooked for too long.",
  },
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
              Making{" "}
              <span className="text-brand-gradient">Potential Visible</span>
            </h1>
            <p className="enter enter-3 mx-auto mt-4 max-w-2xl text-lg text-muted">
              Millions of talented Indians never get a fair shot — not for lack
              of ability, but for lack of access. GoSkilled exists to change
              that: practical skills, taught honestly, in a language that feels
              like home.
            </p>
          </div>
        </section>

        {/* What GoSkilled is */}
        <section
          aria-labelledby="what"
          className="reveal mx-auto w-full max-w-3xl px-4 py-14"
        >
          <h2 id="what" className="font-heading text-2xl font-bold">
            What GoSkilled is
          </h2>
          <div className="mt-4 space-y-4 text-charcoal/80">
            <p>
              GoSkilled is a practical skill-learning platform built for
              mobile-first India. Short, focused lessons in simple Hinglish,
              designed to be finished on a budget phone — so learning fits into
              a real, busy day.
            </p>
            <p>
              We keep pricing honest and GST-inclusive, back every purchase with
              a 48-hour refund, and never sell hype. What you learn is meant to
              be used — at work, in a side project, in real life.
            </p>
          </div>
        </section>

        {/* The gap we exist to close (Phase 1B — verbatim) */}
        <section aria-labelledby="gap" className="reveal bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-14">
            <h2 id="gap" className="font-heading text-2xl font-bold">
              The gap we exist to close
            </h2>
            <p className="mt-4 text-charcoal/80">{GAP_COPY}</p>
          </div>
        </section>

        {/* The goal — Constitution Art 2 fact (public-safe phrasing, no internal codes) */}
        <section aria-label="Our goal" className="reveal">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
            <p className="font-heading text-3xl font-extrabold text-brand sm:text-4xl">
              10 million skilled Indians by 2035
            </p>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              That&apos;s the goal we&apos;re building toward — one learner, one
              real skill at a time.
            </p>
          </div>
        </section>

        {/* Values */}
        <section
          aria-labelledby="values"
          className="reveal mx-auto w-full max-w-5xl px-4 py-14"
        >
          <h2 id="values" className="mb-6 font-heading text-2xl font-bold">
            What we stand for
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ Icon, title, body }) => (
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

        {/* Message from the Founder (Phase 1B — verbatim quote) */}
        <section aria-labelledby="founder-message" className="reveal bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-14">
            <h2
              id="founder-message"
              className="mb-6 font-heading text-2xl font-bold"
            >
              Message from the Founder
            </h2>
            <Card className="bg-brand/5">
              <figure className="flex flex-col gap-4">
                <Quote className="h-8 w-8 text-brand" aria-hidden />
                <blockquote className="text-lg leading-relaxed text-charcoal/90">
                  {FOUNDER_QUOTE}
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Monogram name="Ashish Sangwal" className="h-12 w-12" />
                  <span>
                    <span className="block font-heading font-bold text-charcoal">
                      Ashish Sangwal
                    </span>
                    <span className="block text-sm text-brand">
                      Founder &amp; CEO
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Card>
          </div>
        </section>

        {/* Founding Team (Phase 1B — monograms only) */}
        <section
          aria-labelledby="team"
          className="reveal mx-auto w-full max-w-5xl px-4 py-14"
        >
          <h2 id="team" className="mb-6 font-heading text-2xl font-bold">
            Founding Team
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {TEAM.map((m) => (
              <Card key={m.name} className="flex items-center gap-4">
                <Monogram name={m.name} />
                <div>
                  <p className="font-heading text-lg font-bold">{m.name}</p>
                  <p className="text-sm text-brand">{m.role}</p>
                </div>
              </Card>
            ))}
          </div>
          {/* Company facts strip (Phase 1B — verbatim; no office city / no other members) */}
          <p className="mt-6 text-center text-sm text-muted">
            GoSkilled is a brand of EDZERA LLP · Founded 2025
          </p>
        </section>

        {/* Brand statement (Phase 1B — verbatim closing line) */}
        <section aria-label="Our promise" className="reveal bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
            <p className="font-heading text-2xl font-bold leading-snug text-charcoal sm:text-3xl">
              {BRAND_STATEMENT}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="reveal mx-auto w-full max-w-3xl px-4 py-16">
          <Card className="flex flex-col items-center gap-3 bg-brand text-center text-brand-fg">
            <h2 className="font-heading text-2xl font-bold">Ready to start?</h2>
            <p className="max-w-md text-brand-fg">
              Pick a skill and learn at your own pace — with honest pricing and
              a 48-hour refund.
            </p>
            <div className="w-full max-w-xs">
              <Link href="/courses">
                <Button
                  variant="outline"
                  className="border-brand-fg/50 text-brand-fg hover:bg-white/15"
                >
                  Explore courses
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
