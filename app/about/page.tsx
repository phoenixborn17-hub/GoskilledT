// /about — Phase 1B founder message, founding team, company facts, "the gap". All copy VERBATIM
// from the frozen spec (docs/specs/PHASE_1B_CONTENT_SPEC.md) — do not edit the quoted strings. Team
// avatars are branded monograms — NO photos, NO AI faces (Fable trust override). Re-skinned to the
// Public Experience standard (kit + shell + company timeline signature); copy unchanged.
import {
  Eye,
  HandHeart,
  ShieldCheck,
  Sparkles,
  Quote,
  Flag,
  Rocket,
  Target,
} from "lucide-react";
import { pageMetadata } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import {
  Container,
  Section,
  SectionHeading,
  BentoCard,
  CtaBand,
} from "../../components/marketing/kit";
import { Monogram } from "../../components/marketing/monogram";
import { Card } from "../../components/ui/card";

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

// Honest milestones only (Founded 2025 + goal 2035 are verbatim facts; launch = AI+Marketing live).
const TIMELINE = [
  {
    Icon: Flag,
    year: "2025",
    title: "GoSkilled is founded",
    body: "Started with one clear vision — make practical, industry-ready education accessible to everyone.",
  },
  {
    Icon: Rocket,
    year: "Founding Batch",
    title: "First courses go live",
    body: "AI and Digital Marketing launch for our founding learners — honest pricing, real skills, no hype.",
  },
  {
    Icon: Target,
    year: "2035",
    title: "10 million skilled Indians",
    body: "The goal we're building toward — one learner, one real skill at a time.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <main>
        {/* Mission hero */}
        <section className="hero-aurora">
          <Container className="py-16 text-center sm:py-20">
            <span className="enter inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand-deep">
              <Eye className="h-4 w-4" aria-hidden /> Our mission
            </span>
            <h1 className="enter enter-2 mx-auto mt-4 max-w-3xl font-heading text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
              Making{" "}
              <span className="text-brand-gradient">Potential Visible</span>
            </h1>
            <p className="enter enter-3 mx-auto mt-4 max-w-2xl text-lg text-muted">
              Millions of talented Indians never get a fair shot — not for lack
              of ability, but for lack of access. GoSkilled exists to change
              that: practical skills, taught honestly, in a language that feels
              like home.
            </p>
          </Container>
        </section>

        {/* What GoSkilled is */}
        <Section aria-labelledby="what" innerClassName="max-w-3xl">
          <h2
            id="what"
            className="font-heading text-2xl font-bold text-ink"
          >
            What GoSkilled is
          </h2>
          <div className="mt-4 space-y-4 text-ink/80">
            <p>
              GoSkilled is a practical skill-learning platform built for
              mobile-first India. Short, focused lessons in simple Hinglish,
              designed to be finished on a budget phone — so learning fits into
              a real, busy day.
            </p>
            <p>
              We keep pricing honest — one price, no hidden charges — back every
              purchase with a 48-hour refund, and never sell hype. What you
              learn is meant to be used — at work, in a side project, in real
              life.
            </p>
          </div>
        </Section>

        {/* The gap (verbatim) */}
        <Section aria-labelledby="gap" bg="raised" innerClassName="max-w-3xl">
          <h2
            id="gap"
            className="font-heading text-2xl font-bold text-ink"
          >
            The gap we exist to close
          </h2>
          <p className="mt-4 text-ink/80">{GAP_COPY}</p>
        </Section>

        {/* Company timeline — signature moment (honest milestones only) */}
        <Section aria-labelledby="timeline">
          <SectionHeading
            id="timeline"
            eyebrow="Our journey"
            title="Where we started, where we're headed"
          />
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {TIMELINE.map(({ Icon, year, title, body }, i) => (
              <li key={title} className="reveal relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-gs-lg border border-brand/20 bg-surface-raised text-brand shadow-gs-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-heading text-sm font-bold uppercase tracking-wide text-brand-deep">
                    {year}
                  </span>
                </div>
                <p className="mt-3 font-heading text-lg font-bold text-ink">
                  {title}
                </p>
                <p className="mt-1 text-sm text-muted">{body}</p>
                {i < TIMELINE.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[1.375rem] top-11 hidden h-px w-full bg-brand/15 md:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </Section>

        {/* Values */}
        <Section aria-labelledby="values" bg="raised">
          <SectionHeading id="values" title="What we stand for" />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {VALUES.map(({ Icon, title, body }) => (
              <BentoCard key={title}>
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-lg font-bold text-ink">
                  {title}
                </p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </BentoCard>
            ))}
          </div>
        </Section>

        {/* Founder message (verbatim quote) */}
        <Section aria-labelledby="founder-message" innerClassName="max-w-3xl">
          <SectionHeading
            id="founder-message"
            title="Message from the Founder"
          />
          <Card className="mt-6 bg-brand/5">
            <figure className="flex flex-col gap-4">
              <Quote className="h-8 w-8 text-brand" aria-hidden />
              <blockquote className="text-lg leading-relaxed text-ink/90">
                {FOUNDER_QUOTE}
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Monogram name="Ashish Sangwal" className="h-12 w-12" />
                <span>
                  <span className="block font-heading font-bold text-ink">
                    Ashish Sangwal
                  </span>
                  <span className="block text-sm text-brand">
                    Founder &amp; CEO
                  </span>
                </span>
              </figcaption>
            </figure>
          </Card>
        </Section>

        {/* Founding team (monograms only) */}
        <Section aria-labelledby="team" bg="raised">
          <SectionHeading id="team" title="Founding Team" />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {TEAM.map((m) => (
              <Card key={m.name} className="flex items-center gap-4">
                <Monogram name={m.name} />
                <div>
                  <p className="font-heading text-lg font-bold text-ink">
                    {m.name}
                  </p>
                  <p className="text-sm text-brand">{m.role}</p>
                </div>
              </Card>
            ))}
          </div>
          {/* Company facts strip (Phase 1B — verbatim). */}
          <p className="mt-8 text-center text-sm text-muted">
            GoSkilled is a brand of EDZERA INSPIRING EXCELLENCE LLP · Founded
            2025
          </p>
        </Section>

        {/* Brand statement (verbatim) */}
        <Section aria-label="Our promise" innerClassName="max-w-3xl">
          <p className="text-center font-heading text-2xl font-bold leading-snug text-ink sm:text-3xl">
            {BRAND_STATEMENT}
          </p>
        </Section>

        <CtaBand
          title="Ready to start?"
          subtitle="Pick a skill and learn at your own pace — with honest pricing and a 48-hour refund."
          ctaHref="/courses"
          ctaLabel="Explore courses"
          secondaryHref="/webinar"
          secondaryLabel="Join a free webinar"
        />
      </main>
    </MarketingShell>
  );
}
