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
} from "lucide-react";
import { format } from "date-fns";
import { getCurrentUser } from "../../../lib/auth/session";
import { getHomeSummary, type HomeSummary } from "../../../lib/home/summary";
import { safeMoney, formatCount } from "../../../lib/format";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataValue } from "../../../components/data/data-value";
import { ProgressRing } from "../../../components/data/progress-ring";
import { HeatStrip } from "../../../components/data/heat-strip";
import { NetworkNodes } from "../../../components/data/network-nodes";
import { Spark } from "../../../components/data/spark";
import { AnnouncementBanner } from "../../../components/cards/announcement-banner";
import { ShareWidget } from "../../../components/cards/share-widget";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { MetricCard } from "../../../components/cards/decision/metric-card";
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

export const dynamic = "force-dynamic";
export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await getCurrentUser();
  const summary = await getHomeSummary(user!.id);
  const { affiliateVisible } = summary;

  return (
    <div className="space-y-8">
      {/* ① Command header — greeting + the Spark-bulleted live-stake line (spec §2.2). */}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-h1 font-extrabold text-ink">
            {summary.greetingTitle}
          </h1>
          <Badge variant="gold">Founding Batch</Badge>
        </div>
        <p className="mt-2 flex items-center gap-2 text-body text-ink-muted">
          <span className="text-theme-strong">
            <Spark size={6} />
          </span>
          {summary.sparkLine}
        </p>
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

      {/* ⑧ Announcements + Share. */}
      <Announcements />
      {affiliateVisible && <ShareSection shareUrl={summary.shareUrl} />}
    </div>
  );
}

// ── ② The key-metric row — 4 MetricCards, slot 4 eligibility-forked (HARD LOCK §2.3) ────────────
function MetricRow({ summary }: { summary: HomeSummary }) {
  const m = summary.metrics;
  const learnedToday = m.last7[m.last7.length - 1] > 0;

  return (
    <section aria-label="Your key metrics">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <MetricCard
          icon={GraduationCap}
          label="Progress"
          accent="green"
          index={0}
          live={learnedToday}
          href="/dashboard/learn"
          value={
            <>
              {m.overallPercent}
              <span className="dc-unit">%</span>
            </>
          }
          viz={
            <ProgressRing
              value={m.overallPercent}
              size={44}
              strokeWidth={5}
              label={`Overall progress ${m.overallPercent}%`}
              spark
            >
              <span aria-hidden />
            </ProgressRing>
          }
          caption={
            m.weekLessons > 0
              ? `${m.weekLessons} ${m.weekLessons === 1 ? "lesson" : "lessons"} this week`
              : summary.lifecycleNew
                ? "Lesson 1 unlocks your analytics."
                : "Pick up where you left off."
          }
        />

        <MetricCard
          icon={Flame}
          label="Streak"
          accent="green"
          index={1}
          live={learnedToday && m.streak.current > 0}
          href="/dashboard/learn"
          value={
            <>
              {m.streak.current}
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

        <MetricCard
          icon={Award}
          label="Certificates"
          accent="green"
          index={2}
          href="/dashboard/progress"
          value={formatCount(m.certificates)}
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
 *  visible-not-eligible → people-not-money · eligible → DR-043 recorded earnings. */
function EarnSlot({ summary }: { summary: HomeSummary }) {
  const { earn } = summary;

  // Eligible affiliate — recorded earnings (DR-043: recorded ≠ payable; NEVER "ready to withdraw").
  if (earn.kind === "recorded") {
    return (
      <MetricCard
        icon={Wallet}
        label="Recorded earnings"
        accent="gold"
        index={3}
        href="/dashboard/earn/wallet"
        badge={
          earn.payoutsOpen && earn.availableInPaise > 0
            ? { label: "Available", tone: "live" }
            : undefined
        }
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
      <MetricCard
        icon={Users}
        label="Your network"
        accent="gold"
        index={3}
        href="/dashboard/earn"
        value={formatCount(earn.l1Count)}
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
      <MetricCard
        icon={CalendarDays}
        label="Next webinar"
        accent="info"
        index={3}
        href="/webinar"
        badge={
          summary.webinarToday ? { label: "Today", tone: "live" } : undefined
        }
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
    <MetricCard
      icon={Target}
      label="Next milestone"
      accent="info"
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
              href="/webinar"
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
      href: "/webinar",
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
      href="/courses"
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
