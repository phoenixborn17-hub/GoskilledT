// GoSkilled Home COMMAND CENTER (Command_Center_Dashboard_Spec §2 · Slice 1) — the one place both
// domains meet: greeting + spark line, the cross-domain KEY-METRIC row (eligibility-forked THREE
// ways, spec §2.3 hard lock), Continue hero, momentum band, For-you feed, workspace snapshots —
// with the Store strip DEMOTED to band ⑦ (the returning learner's momentum outranks merchandising).
// COMPOSITE page: reads/composes existing data only; rich-honest-zero everywhere (ThreeState law);
// money static + safeMoney; nothing fabricated (D-29).
import { Suspense } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Flame,
  GraduationCap,
  Award,
  Users,
  Wallet,
  Target,
  Rocket,
  Store,
  Sparkles,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { getCurrentUser } from "../../../lib/auth/session";
import { getHomeSummary, type HomeSummary } from "../../../lib/home/summary";
import { safeMoney } from "../../../lib/format";

import { Button } from "../../../components/ui/button";
import { DataValue } from "../../../components/data/data-value";
import { CountUp, AnimatedRing } from "../../../components/data/animated";
import { HeatStrip } from "../../../components/data/heat-strip";
import { NetworkNodes } from "../../../components/data/network-nodes";
import { Spark } from "../../../components/data/spark";
import { AnnouncementBanner } from "../../../components/cards/announcement-banner";
import { ShareWidget } from "../../../components/cards/share-widget";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { VibrantMetricCard } from "../../../components/cards/decision/vibrant-metric-card";
import { BentoGrid, BentoItem } from "../../../components/cards/decision/bento";
import { ContinueLearningCard } from "../../../components/cards/decision/continue-learning-card";
import {
  EnterWorkspaces,
  EnterWorkspacesSkeleton,
} from "../../../components/home/enter-workspaces";
import {
  MomentumBand,
  MomentumBandSkeleton,
} from "../../../components/home/momentum-band";
import {
  ForYouFeed,
  ForYouFeedSkeleton,
  type FeedNudge,
} from "../../../components/home/for-you-feed";
import { PromoBannerSlot } from "../../../components/home/promo-banner-slot";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await getCurrentUser();
  const summary = await getHomeSummary(user!.id);
  const { affiliateVisible } = summary;

  return (
    <div className="gs-vibrant space-y-8">
      {/* ⓪ Promo banner SLOT (Vibrant v1.0 rollout) — honest static content for now; the
          admin-managed media version (image/GIF/video + URL) is a separate feature build. */}
      <section aria-label="Announcement banner" className="dc-enter">
        <Link
          href="/dashboard/learn/browse"
          className="vh-banner block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2 md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="vh-hero-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wide">
                <Megaphone className="h-3.5 w-3.5" aria-hidden />
                From GoSkilled
              </span>
              <h2 className="mt-3 font-heading text-h2 font-extrabold leading-tight">
                New skills are landing on GoSkilled
              </h2>
              <p className="mt-1 max-w-prose text-small text-white/80">
                Browse the catalog — every course is mobile-first, in simple
                Hinglish, with a verifiable certificate.
              </p>
            </div>
            <span className="vh-hero-chip inline-flex shrink-0 items-center gap-2 rounded-gs-lg px-5 py-3 text-small font-bold">
              Browse courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </Link>
      </section>

      {/* ① Command hero — greeting + the Spark-bulleted live-stake line (spec §2.2), on the
          vibrant hero band. Glance chips carry REAL values only. */}
      <header className="vh-hero dc-enter p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="vh-hero-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Founding Batch
            </span>
            <h1 className="mt-3 font-heading text-display font-extrabold leading-tight">
              {summary.greetingTitle}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-body text-white/85">
              <span style={{ color: "#EDC825" }}>
                <Spark size={6} />
              </span>
              {summary.sparkLine}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="vh-hero-chip inline-flex items-center gap-2 rounded-gs-lg px-3.5 py-2">
              <Flame className="h-4 w-4" aria-hidden />
              <span className="dc-number text-h4 font-bold leading-none">
                {summary.metrics.streak.current}d
              </span>
              <span className="text-caption text-white/75">streak</span>
            </span>
            <span className="vh-hero-chip inline-flex items-center gap-2 rounded-gs-lg px-3.5 py-2">
              <GraduationCap className="h-4 w-4" aria-hidden />
              <span className="dc-number text-h4 font-bold leading-none">
                {summary.metrics.overallPercent}%
              </span>
              <span className="text-caption text-white/75">progress</span>
            </span>
          </div>
        </div>
      </header>

      {/* ② Key-metric row — the cross-domain unification (spec §2.3/§2.4). */}
      <MetricRow summary={summary} />

      {/* Getting-started strip — ONE motivating element for new users (ThreeState law); the full
          rich dashboard still renders below it. */}
      {summary.lifecycleNew && (
        <GettingStartedStrip affiliateVisible={affiliateVisible} />
      )}

      {/* ③ Continue hero. */}
      <ContinueHero summary={summary} />

      {/* ④ Momentum band (streamed). */}
      <Suspense fallback={<MomentumBandSkeleton />}>
        <MomentumBand userId={user!.id} />
      </Suspense>

      {/* ⑤ For-you feed (streamed) — nudges from real summary state + the activity tail. */}
      <Suspense fallback={<ForYouFeedSkeleton />}>
        <ForYouFeed userId={user!.id} nudges={buildNudges(summary)} />
      </Suspense>

      {/* ⑥ Enter-workspace snapshots (streamed, existing). */}
      <Suspense fallback={<EnterWorkspacesSkeleton />}>
        <EnterWorkspaces userId={user!.id} />
      </Suspense>

      {/* ⑦ Store — still first-class (Nav v1.1: Explore folded into Home), demoted below momentum. */}
      <StoreStrip />

      {/* Admin promo banner (Feature Batch v1.0 §2) — scheduled queue, renders nothing when there's
          no live banner (honest-empty, D-29). Same low-priority placement as Store/Announcements. */}
      <Suspense fallback={null}>
        <PromoBannerSlot />
      </Suspense>

      {/* ⑧ Announcements + Share. */}
      <Announcements />
      {affiliateVisible && <ShareSection shareUrl={summary.shareUrl} />}
    </div>
  );
}

// ── ② The key-metric row — 4 VibrantMetricCards on the promoted v5 recipe; slot 4 stays
//    eligibility-forked (HARD LOCK §2.3). De-clustered accents: emerald / orange / purple /
//    (gold-vault | indigo | cyan) — no same-accent neighbours. Money stays STATIC (<DataValue>). ──
function MetricRow({ summary }: { summary: HomeSummary }) {
  const m = summary.metrics;
  const learnedToday = m.last7[m.last7.length - 1] > 0;

  return (
    <section aria-label="Your key metrics">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <VibrantMetricCard
          bold
          icon={GraduationCap}
          label="Progress"
          accent="vh-accent-learn"
          index={0}
          live={learnedToday}
          href="/dashboard/learn"
          value={
            <>
              <CountUp value={m.overallPercent} />
              <span className="dc-unit">%</span>
            </>
          }
          viz={
            <AnimatedRing
              value={m.overallPercent}
              size={44}
              strokeWidth={5}
              label={`Overall progress ${m.overallPercent}%`}
            >
              <span aria-hidden />
            </AnimatedRing>
          }
          delta={
            m.weekLessons > 0
              ? `▲ ${m.weekLessons} ${m.weekLessons === 1 ? "lesson" : "lessons"} this week`
              : null
          }
          caption={
            m.weekLessons > 0
              ? null
              : summary.lifecycleNew
                ? "Lesson 1 unlocks your analytics."
                : "Pick up where you left off."
          }
        />

        <VibrantMetricCard
          icon={Flame}
          label="Streak"
          accent="vh-accent-streak"
          index={1}
          live={learnedToday && m.streak.current > 0}
          href="/dashboard/learn"
          value={
            <>
              <CountUp value={m.streak.current} />
              <span className="dc-unit">
                {m.streak.current === 1 ? "day" : "days"}
              </span>
            </>
          }
          viz={
            <HeatStrip
              values={m.last7}
              label={`Active ${m.last7.filter((v) => v > 0).length} of the last 7 days`}
            />
          }
          caption={
            m.streak.current === 0
              ? "Complete a lesson today to start your streak."
              : m.streak.atRisk
                ? "A lesson today keeps it going."
                : m.streak.longest > m.streak.current
                  ? `Best: ${m.streak.longest} days`
                  : "Your best streak yet."
          }
        />

        <VibrantMetricCard
          icon={Award}
          label="Certificates"
          accent="vh-accent-achieve"
          index={2}
          href="/dashboard/progress"
          value={<CountUp value={m.certificates} />}
          viz={<Award className="h-8 w-8" aria-hidden />}
          caption={
            m.certificates === 0
              ? "Your first seal awaits."
              : "Verified & shareable."
          }
        />

        <EarnSlot summary={summary} />
      </div>
    </section>
  );
}

/** Slot 4 — the three-way fork (spec §2.3): hidden → learning-first fallback (zero earn trace) ·
 *  visible-not-eligible → people-not-money · eligible → DR-043 recorded earnings (gold-vault). */
function EarnSlot({ summary }: { summary: HomeSummary }) {
  const { earn } = summary;

  // Eligible affiliate — recorded earnings (DR-043: recorded ≠ payable; NEVER "ready to withdraw").
  // The gold-vault focal: metallic numerals, money STATIC via <DataValue> (never animated).
  if (earn.kind === "recorded") {
    return (
      <VibrantMetricCard
        bold
        icon={Wallet}
        label="Recorded earnings"
        accent="vh-accent-earn"
        index={3}
        href="/dashboard/earn/wallet"
        badge={
          earn.payoutsOpen && earn.availableInPaise > 0
            ? "Available"
            : undefined
        }
        numClassName="vh-gold-num"
        value={<DataValue value={safeMoney(earn.totalInPaise)} raiseUnit />}
        caption={
          earn.payoutsOpen
            ? earn.heldInPaise > 0
              ? "Includes held commissions clearing their 48h window."
              : "Recorded to your wallet."
            : earn.totalInPaise > 0
              ? "Recorded to your wallet — payouts open at launch."
              : "Your wallet is ready to receive commissions."
        }
      />
    );
  }

  // Visible but NOT eligible (DR-038) — about people, never ₹, never share-to-earn.
  if (earn.kind === "network") {
    return (
      <VibrantMetricCard
        bold
        icon={Users}
        label="Your network"
        accent="vh-accent-network"
        index={3}
        href="/dashboard/earn"
        value={<CountUp value={earn.l1Count} />}
        viz={<NetworkNodes count={earn.l1Count} height={40} />}
        caption={
          earn.l1Count === 0
            ? "See how earning works."
            : `${earn.l1Count === 1 ? "friend has" : "friends have"} joined with your link.`
        }
      />
    );
  }

  // Affiliate layer hidden (DR-040) — zero earn trace; a learning-first slot instead.
  if (summary.webinarNext) {
    return (
      <VibrantMetricCard
        icon={CalendarDays}
        label="Next webinar"
        accent="vh-accent-cyan"
        index={3}
        href="/dashboard/learn/webinars"
        badge={summary.webinarToday ? "Today" : undefined}
        value={
          <span className="text-h4 font-bold leading-snug">
            {format(summary.webinarNext.startsAt, "EEE, d MMM")}
          </span>
        }
        caption={summary.webinarNext.title}
      />
    );
  }
  return (
    <VibrantMetricCard
      icon={Target}
      label="Next milestone"
      accent="vh-accent-cyan"
      index={3}
      href="/dashboard/progress"
      value={
        <span className="text-h4 font-bold leading-snug">
          {summary.nextMilestone ?? "All milestones earned"}
        </span>
      }
      caption={
        summary.nextMilestone
          ? "Your next learning achievement."
          : "You've earned every milestone we have."
      }
    />
  );
}

// ── ③ Continue hero ──────────────────────────────────────────────────────────────
function ContinueHero({ summary }: { summary: HomeSummary }) {
  const { nextLesson, webinarToday } = summary;
  return (
    <section aria-label="Continue">
      <BentoGrid>
        <BentoItem size="hero" className={webinarToday ? "" : "xl:col-span-4"}>
          {nextLesson ? (
            <ContinueLearningCard
              href={nextLesson.href}
              courseTitle={nextLesson.title}
              lessonLabel={nextLesson.subtitle}
              percent={nextLesson.percent ?? 0}
            />
          ) : (
            <DecisionCard
              icon={BookOpen}
              label="Start learning"
              accent="green"
              size="hero"
              cta="Browse courses"
              href="/dashboard/learn"
            >
              <div>
                <h3 className="font-heading text-h2 font-bold text-ink">
                  Pick your first course
                </h3>
                <p className="mt-2 text-body text-ink-muted">
                  Watch the first lesson free — no purchase needed.
                </p>
              </div>
            </DecisionCard>
          )}
        </BentoItem>

        {webinarToday && (
          <BentoItem size="hero">
            <DecisionCard
              icon={CalendarDays}
              label="Today's webinar"
              accent="info"
              size="hero"
              badge={{ label: "Today", tone: "live" }}
              cta="Join webinar"
              href="/dashboard/learn/webinars"
            >
              <div>
                <p className="font-heading text-h3 font-bold text-ink">
                  {webinarToday.title}
                </p>
                <p className="mt-1 text-small text-ink-muted">
                  {format(webinarToday.startsAt, "h:mm a")}
                </p>
              </div>
            </DecisionCard>
          </BentoItem>
        )}
      </BentoGrid>
    </section>
  );
}

// ── ⑤ Nudges — rules over real summary state only (never fabricated, D-29) ───────
function buildNudges(summary: HomeSummary): FeedNudge[] {
  const nudges: FeedNudge[] = [];
  if (summary.webinarToday) {
    nudges.push({
      icon: "webinar",
      title: "Live webinar today",
      description: `Starts at ${format(summary.webinarToday.startsAt, "h:mm a")}`,
      time: "Today",
      tone: "info",
      href: "/dashboard/learn/webinars",
    });
  }
  if (summary.streak.atRisk) {
    nudges.push({
      icon: "streak",
      title: "Keep your streak alive",
      description: "A 2-minute lesson today keeps it going.",
      time: "Today",
      tone: "warning",
      href: summary.nextLesson?.href ?? "/dashboard/learn",
    });
  }
  return nudges;
}

// ── ⑦ Store strip (demoted from position 1 → the plan's QW-1 reorder) ────────────
function StoreStrip() {
  return (
    <Link
      href="/dashboard/learn/browse"
      className="lift flex items-center gap-4 rounded-gs-lg border border-line bg-surface-raised p-5"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme/10 text-theme-strong"
        aria-hidden
      >
        <Store className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-h4 font-bold text-ink">
          Browse the Store
        </p>
        <p className="text-small text-ink-muted">
          Explore all courses and packages
        </p>
      </div>
      <span className="shrink-0 text-small font-semibold text-theme-strong">
        Open →
      </span>
    </Link>
  );
}

// ── ⑧ Announcements — admin CMS [Phase F-Admin] → a truthful static fallback (never fake) ──
function Announcements() {
  return (
    <AnnouncementBanner
      dismissible
      storageKey="gs-announce-founding-batch"
      title="Welcome to the Founding Batch"
      description="You're getting early access as GoSkilled grows — new courses are on the way."
    />
  );
}

// ── ⑧ Share ──────────────────────────────────────────────────────────────────────
function ShareSection({ shareUrl }: { shareUrl: string }) {
  return (
    <ShareWidget
      link={shareUrl}
      whatsappMessage={`Main GoSkilled par seekh raha hoon — tu bhi join kar: ${shareUrl}`}
    />
  );
}

// ── Getting-started STRIP (ThreeState law) — ONE motivating element above the full dashboard for
//    new users; it guides, it does not replace the rich cards below. Never empty/fake (D-29). ─────
function GettingStartedStrip({
  affiliateVisible,
}: {
  affiliateVisible: boolean;
}) {
  const steps = [
    {
      title: "Pick your first course",
      description: "Browse the catalog and choose what to learn.",
      action: (
        <Link href="/dashboard/learn">
          <Button className="w-auto">Browse courses</Button>
        </Link>
      ),
    },
    {
      title: "Watch your first lesson",
      description: "Just 2 minutes to your first win.",
    },
    // The referral step is part of the Affiliate layer — dropped when hidden (DR-040).
    ...(affiliateVisible
      ? [{ title: "Share your referral link with a friend" }]
      : []),
  ];
  return (
    <GettingStartedCard
      icon={Rocket}
      title="New here? Start with these"
      subtitle={`${steps.length} quick steps to your first win`}
      steps={steps}
    />
  );
}
