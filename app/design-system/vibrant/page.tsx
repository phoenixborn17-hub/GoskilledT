// VIBRANT HOME — direction study (branch gps-vibrant-home · founder sign-off BEFORE any rollout).
// A high-fidelity mockup of the dashboard Home at the bold/vibrant end, on a STANDALONE preview
// route: the live Home is untouched; all styles are scoped (.vibrant-home / .vh-*). It renders the
// VIEWER'S REAL Home data through the same loaders the product uses — greeting, spark line, the
// eligibility-forked metric row, momentum, for-you feed — so every number is real or honest-zero
// (D-29/D-01/DR-043 hold even in a mockup). Multi-accent system is MEANINGFUL, not rainbow:
// learn=green · earn=gold (amber for text — Rule 14) · achievement=violet · status=blue.
import Link from "next/link";
import { format } from "date-fns";
import {
  GraduationCap,
  Flame,
  Award,
  Wallet,
  Users,
  CalendarDays,
  Target,
  TrendingUp,
  Coins,
  PlayCircle,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { getHomeSummary, type HomeSummary } from "../../../lib/home/summary";
import { getHomeMomentum } from "../../../lib/home/momentum";
import { getRecentActivity, relativeDayLabel } from "../../../lib/home/feed";
import {
  safeMoney,
  formatCount,
  formatINRFromPaise,
} from "../../../lib/format";
import { Badge } from "../../../components/ui/badge";
import { DataValue } from "../../../components/data/data-value";
import { ProgressRing } from "../../../components/data/progress-ring";
import { HeatStrip } from "../../../components/data/heat-strip";
import { NetworkNodes } from "../../../components/data/network-nodes";
import { AreaChart } from "../../../components/data/area-chart";
import { Spark } from "../../../components/data/spark";
import { DeviceTierProvider } from "../../../components/system/device-tier-provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vibrant Home — direction study" };

export default async function VibrantHomePage() {
  const user = await getCurrentUser();
  const [summary, momentum, activity] = await Promise.all([
    getHomeSummary(user!.id),
    getHomeMomentum(user!.id),
    getRecentActivity(user!.id, 3),
  ]);
  const m = summary.metrics;
  const learnedToday = m.last7[m.last7.length - 1] > 0;

  return (
    <div className="vibrant-home min-h-dvh">
      <DeviceTierProvider />
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-8">
        {/* Preview banner — this is a direction study, never the live surface. */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">Direction study</Badge>
          <p className="text-caption text-ink-muted">
            Vibrant Home mockup · real data, honest zeros · the live Home is
            unchanged. Sign-off decides rollout.
          </p>
        </div>

        {/* ① Command hero — deep-green aurora, the greeting owns the stage. */}
        <header className="vh-hero p-6 md:p-8">
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
                <span className="text-gold-400" style={{ color: "#EDC825" }}>
                  <Spark size={6} />
                </span>
                {summary.sparkLine}
              </p>
            </div>
            {/* Live glance chips — real values only. */}
            <div className="flex shrink-0 flex-wrap gap-2">
              <HeroChip
                icon={Flame}
                label={`${m.streak.current} ${m.streak.current === 1 ? "day" : "days"}`}
                sub="streak"
              />
              <HeroChip
                icon={GraduationCap}
                label={`${m.overallPercent}%`}
                sub="progress"
              />
            </div>
          </div>
        </header>

        {/* ② Key-metric row — the meaningful multi-accent system. */}
        <section aria-label="Your key metrics">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <VibrantMetric
              accent="vh-accent-learn"
              icon={GraduationCap}
              label="Progress"
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
                  size={46}
                  strokeWidth={5}
                  label={`Overall progress ${m.overallPercent}%`}
                >
                  <span aria-hidden />
                </ProgressRing>
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

            <VibrantMetric
              accent="vh-accent-earn"
              icon={Flame}
              label="Streak"
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
              delta={
                m.streak.longest > m.streak.current && m.streak.current > 0
                  ? `Best: ${m.streak.longest} days`
                  : null
              }
              caption={
                m.streak.current === 0
                  ? "Complete a lesson today to start your streak."
                  : m.streak.atRisk
                    ? "A lesson today keeps it going."
                    : m.streak.longest <= m.streak.current
                      ? "Your best streak yet."
                      : null
              }
            />

            <VibrantMetric
              accent="vh-accent-achieve"
              icon={Award}
              label="Certificates"
              href="/dashboard/progress"
              value={formatCount(m.certificates)}
              viz={<Award className="h-8 w-8" aria-hidden />}
              caption={
                m.certificates === 0
                  ? "Your first seal awaits."
                  : "Verified & shareable."
              }
            />

            <VibrantEarnSlot summary={summary} />
          </div>
        </section>

        {/* ③ Momentum — gradient-glow analytics, honest unlock shells at zero. */}
        <section aria-label="Your momentum">
          <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
            Your momentum
          </h2>
          <div
            className={
              momentum.earn ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"
            }
          >
            <VibrantPanel
              accent="vh-accent-learn"
              icon={TrendingUp}
              title="Learning activity"
              meta="Last 14 days"
            >
              {momentum.learningTotal > 0 ? (
                <>
                  <AreaChart
                    points={momentum.learning}
                    height={104}
                    color="#137E49"
                    label="Lessons completed per day, last 14 days"
                  />
                  <p className="sr-only">
                    {momentum.learningTotal} lessons completed over the last 14
                    days
                  </p>
                </>
              ) : (
                <UnlockShell
                  line="Your momentum graph starts with your first lesson."
                  cta={{ label: "Start learning", href: "/dashboard/learn" }}
                />
              )}
            </VibrantPanel>

            {momentum.earn && (
              <VibrantPanel
                accent="vh-accent-earn"
                icon={Coins}
                title="Recorded earnings"
                meta="Last 14 days · recorded to your wallet"
              >
                {momentum.earn.totalInPaise > 0 ? (
                  <>
                    <AreaChart
                      points={momentum.earn.series}
                      height={104}
                      color="#B87A00"
                      label="Commission recorded per day, last 14 days"
                    />
                    <p className="sr-only">
                      {formatINRFromPaise(momentum.earn.totalInPaise)} recorded
                      over the last 14 days
                    </p>
                  </>
                ) : (
                  <UnlockShell
                    line="Your earnings trend appears with your first recorded commission."
                    cta={{ label: "Open Earn", href: "/dashboard/earn" }}
                  />
                )}
              </VibrantPanel>
            )}
          </div>
        </section>

        {/* ④ For-you feed — accent-plated rows, real events only. */}
        <section aria-label="For you today">
          <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
            For you today
          </h2>
          <div className="vh-card vh-accent-status p-2">
            <div className="space-y-1 pt-1.5">
              {summary.webinarToday && (
                <FeedRow
                  accent="vh-accent-status"
                  icon={CalendarDays}
                  title="Live webinar today"
                  description={`Starts at ${format(summary.webinarToday.startsAt, "h:mm a")}`}
                  time="Today"
                  href="/dashboard/learn/webinars"
                />
              )}
              {summary.streak.atRisk && (
                <FeedRow
                  accent="vh-accent-earn"
                  icon={Flame}
                  title="Keep your streak alive"
                  description="A 2-minute lesson today keeps it going."
                  time="Today"
                  href={summary.nextLesson?.href ?? "/dashboard/learn"}
                />
              )}
              {activity.map((e, i) => (
                <FeedRow
                  key={i}
                  accent={
                    e.kind === "certificate"
                      ? "vh-accent-achieve"
                      : e.kind === "referral"
                        ? "vh-accent-earn"
                        : "vh-accent-learn"
                  }
                  icon={
                    e.kind === "certificate"
                      ? Award
                      : e.kind === "referral"
                        ? Users
                        : PlayCircle
                  }
                  title={e.title}
                  description={e.description}
                  time={relativeDayLabel(e.at)}
                />
              ))}
              {!summary.webinarToday &&
                !summary.streak.atRisk &&
                activity.length === 0 && (
                  <p className="px-3 py-6 text-center text-small text-ink-muted">
                    You&apos;re all caught up — new nudges appear here as you
                    learn and share.
                  </p>
                )}
            </div>
          </div>
        </section>

        <p className="text-caption text-ink-muted">
          Direction study only — colors/gradients/shadows are the proposal; the
          data, honesty rules, and eligibility gates are the product&apos;s own.
          Compare with the live{" "}
          <Link
            href="/dashboard/home"
            className="font-semibold text-theme-strong"
          >
            Home
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

// ── pieces (mockup-local — nothing shared with the live Home) ────────────────────

function HeroChip({
  icon: Icon,
  label,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <span className="vh-hero-chip inline-flex items-center gap-2 rounded-2xl px-3.5 py-2">
      <Icon className="h-4 w-4" aria-hidden />
      <span className="dc-number text-h4 font-bold leading-none">{label}</span>
      <span className="text-caption text-white/75">{sub}</span>
    </span>
  );
}

function VibrantMetric({
  accent,
  icon: Icon,
  label,
  value,
  viz,
  delta,
  caption,
  live = false,
  href,
  badge,
}: {
  accent: string;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  viz?: React.ReactNode;
  delta?: string | null;
  caption?: string | null;
  live?: boolean;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`vh-card ${accent} flex h-full flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2 md:p-5`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`vh-plate flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge && (
          <span className="vh-delta rounded-full px-2 py-0.5 text-caption font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {live ? (
          <span className="vh-text">
            <Spark size={6} />
          </span>
        ) : null}
        <p className="font-heading text-small font-semibold text-ink">
          {label}
        </p>
      </div>
      <div className="mt-2 flex flex-1 items-end justify-between gap-3">
        <p className="dc-number text-h2 font-bold leading-none text-ink md:text-h1">
          {value}
        </p>
        {viz && <div className="vh-text shrink-0 pb-0.5">{viz}</div>}
      </div>
      {delta ? (
        <p className="vh-delta mt-3 inline-flex w-fit rounded-full px-2.5 py-1 text-caption font-semibold">
          {delta}
        </p>
      ) : caption ? (
        <p className="mt-3 text-caption leading-snug text-ink-muted">
          {caption}
        </p>
      ) : null}
    </Link>
  );
}

/** Slot 4 — the SAME three-way eligibility fork as the live Home (structural, spec §2.3). */
function VibrantEarnSlot({ summary }: { summary: HomeSummary }) {
  const { earn } = summary;
  if (earn.kind === "recorded") {
    return (
      <VibrantMetric
        accent="vh-accent-earn"
        icon={Wallet}
        label="Recorded earnings"
        href="/dashboard/earn/wallet"
        badge={
          earn.payoutsOpen && earn.availableInPaise > 0
            ? "Available"
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
  if (earn.kind === "network") {
    return (
      <VibrantMetric
        accent="vh-accent-earn"
        icon={Users}
        label="Your network"
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
  if (summary.webinarNext) {
    return (
      <VibrantMetric
        accent="vh-accent-status"
        icon={CalendarDays}
        label="Next webinar"
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
    <VibrantMetric
      accent="vh-accent-status"
      icon={Target}
      label="Next milestone"
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

function VibrantPanel({
  accent,
  icon: Icon,
  title,
  meta,
  children,
}: {
  accent: string;
  icon: LucideIcon;
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`vh-card ${accent} p-5 md:p-6`}>
      <div className="flex items-center gap-3">
        <span
          className="vh-plate flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-small font-bold text-ink">
            {title}
          </h3>
          {meta && <p className="text-caption text-ink-muted">{meta}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function UnlockShell({
  line,
  cta,
}: {
  line: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col items-start justify-center gap-2">
      <p className="max-w-prose text-body text-ink-muted">{line}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
      >
        {cta.label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function FeedRow({
  accent,
  icon: Icon,
  title,
  description,
  time,
  href,
}: {
  accent: string;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  href?: string;
}) {
  const inner = (
    <>
      <span
        className={`vh-plate ${accent} flex h-10 w-10 shrink-0 items-center justify-center rounded-full`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-small font-semibold text-ink">{title}</p>
          <span className="shrink-0 text-caption text-ink-muted">{time}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-caption text-ink-muted">
          {description}
        </p>
      </div>
    </>
  );
  const cls =
    "flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
