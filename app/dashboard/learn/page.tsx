// Learn workspace dashboard (Redesign U4 · Dashboard §3; Vibrant rollout Slice B — see
// docs/specs/Vibrant_CardSystem_Amendment_v1.0.md §5). Header + key-metric row promoted onto the
// Vibrant Card System (same components Home Slice A consumes); Continue hero, tabs, courses,
// recommendations, quick actions stay on the calm dc-recipe by design (Command Center Spec §1.3:
// Learn is a focused-depth workspace, not a second command center). COMPOSITE over existing LMS
// data (no route/business-logic change). Zero-data → 3-step getting-started (never empty, D-29).
import Link from "next/link";
import {
  BookOpen,
  Target,
  Award,
  Flame,
  PlayCircle,
  Share2,
  Compass,
  CalendarDays,
  Rocket,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { isFeatureVisible } from "../../../lib/feature-visibility/context";
import {
  getLearnDashboard,
  type LearnDashboard,
} from "../../../lib/learn/dashboard";

import { Button } from "../../../components/ui/button";
import { Tabs } from "../../../components/ui/tabs";
import { ChartCard } from "../../../components/cards/chart-card";
import { CourseCard } from "../../../components/cards/course-card";
import { QuickActionCard } from "../../../components/cards/quick-action-card";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { ContinueLearningCard } from "../../../components/cards/decision/continue-learning-card";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { VibrantMetricCard } from "../../../components/cards/decision/vibrant-metric-card";
import { AreaChart } from "../../../components/data/area-chart";
import { CountUp, AnimatedRing } from "../../../components/data/animated";
import { HeatStrip } from "../../../components/data/heat-strip";
import { Spark } from "../../../components/data/spark";

export const dynamic = "force-dynamic";
export const metadata = { title: "Learn" };

const GOAL_SUBLINE: Record<string, string> = {
  SKILL: "Let's sharpen a skill today.",
  INCOME: "Real skills come first — keep building.",
  BOTH: "Keep learning at your own pace.",
};

export default async function LearnPage() {
  const user = await getCurrentUser();
  const [d, affiliateVisible] = await Promise.all([
    getLearnDashboard(user!.id),
    isFeatureVisible("earn"), // DR-040: gate the cross-cutting referral affordance on Learn
  ]);

  return (
    <div className="gs-vibrant space-y-8">
      {/* Header — Vibrant hero band (Slice B; same recipe as Home's command header, R2 grammar:
          title + one context line, here on the deep-green learn band). Glance chips carry real
          values only (streak/progress) — no fabricated stats. */}
      <header className="vh-hero dc-enter p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-display font-extrabold leading-tight">
              Your learning{d.name ? `, ${d.name}` : ""}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-body text-white/85">
              <span style={{ color: "#EDC825" }}>
                <Spark size={6} />
              </span>
              {(d.goal && GOAL_SUBLINE[d.goal]) ??
                "Continue where you left off."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="vh-hero-chip inline-flex items-center gap-2 rounded-gs-lg px-3.5 py-2">
              <Flame className="h-4 w-4" aria-hidden />
              <span className="dc-number text-h4 font-bold leading-none">
                {d.stats.streak}d
              </span>
              <span className="text-caption text-white/75">streak</span>
            </span>
            <span className="vh-hero-chip inline-flex items-center gap-2 rounded-gs-lg px-3.5 py-2">
              <Target className="h-4 w-4" aria-hidden />
              <span className="dc-number text-h4 font-bold leading-none">
                {d.stats.overallPercent}%
              </span>
              <span className="text-caption text-white/75">progress</span>
            </span>
          </div>
        </div>
      </header>

      {/* Rich-Honest-Zero (ThreeState law): the FULL Learn dashboard renders even for a brand-new
          learner — honest 0s (courses/progress/certificates/streak) with motivating unlock hints on
          each card. A single getting-started strip is the one extra element, not a replacement. */}
      {d.lifecycleNew && (
        <GettingStartedStrip affiliateVisible={affiliateVisible} />
      )}
      <Loaded d={d} affiliateVisible={affiliateVisible} />
    </div>
  );
}

function Loaded({
  d,
  affiliateVisible,
}: {
  d: LearnDashboard;
  affiliateVisible: boolean;
}) {
  const remaining = d.active ? d.active.total - d.active.completed : 0;
  const heroAi =
    d.active && d.active.percent > 0 && remaining > 0
      ? `You're ${d.active.percent}% through — ${remaining} ${remaining === 1 ? "lesson" : "lessons"} to your certificate.`
      : null;

  return (
    <>
      {/* Continue hero (action-first, first viewport). New: an honest "start learning" hero instead
          of an empty slot (ThreeState law — the dashboard is never blank). */}
      {d.active ? (
        <ContinueLearningCard
          href={d.active.resumeHref}
          courseTitle={d.active.title}
          lessonLabel={`${d.active.completed} / ${d.active.total} lessons`}
          percent={d.active.percent}
          aiLine={heroAi}
        />
      ) : (
        <DecisionCard
          icon={BookOpen}
          label="Start learning"
          accent="green"
          size="hero"
          cta="Browse courses"
          href="/dashboard/learn/browse"
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

      {/* ≤4 key-metric cards — Vibrant Card System v1.0 (Slice B), de-clustered accents (no two
          same-accent neighbours): cyan Courses · bold-emerald Progress (focal) · purple
          Certificates · orange Streak. Unlock micro-states (ThreeState law): honest 0 always
          motivates the next step; nothing fabricated. */}
      <section aria-label="Your key metrics">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <VibrantMetricCard
            icon={BookOpen}
            label="Courses"
            accent="vh-accent-cyan"
            index={0}
            href="/dashboard/courses"
            value={<CountUp value={d.stats.courses} />}
            viz={<BookOpen className="h-8 w-8" aria-hidden />}
            caption={
              d.stats.courses === 0
                ? "Enroll to begin your journey."
                : "Enrolled courses."
            }
          />

          <VibrantMetricCard
            bold
            icon={Target}
            label="Progress"
            accent="vh-accent-learn"
            index={1}
            live={d.last7[d.last7.length - 1] > 0}
            href={d.active?.resumeHref ?? "/dashboard/learn/browse"}
            value={
              <>
                <CountUp value={d.stats.overallPercent} />
                <span className="dc-unit">%</span>
              </>
            }
            viz={
              <AnimatedRing
                value={d.stats.overallPercent}
                size={44}
                strokeWidth={5}
                label={`Overall progress ${d.stats.overallPercent}%`}
              >
                <span aria-hidden />
              </AnimatedRing>
            }
            delta={
              d.weekLessons > 0
                ? `▲ ${d.weekLessons} ${d.weekLessons === 1 ? "lesson" : "lessons"} this week`
                : null
            }
            caption={
              d.weekLessons > 0
                ? null
                : d.stats.overallPercent === 0
                  ? "Complete a lesson to grow this."
                  : "Pick up where you left off."
            }
          />

          <VibrantMetricCard
            icon={Award}
            label="Certificates"
            accent="vh-accent-achieve"
            index={2}
            href="/dashboard/progress"
            value={<CountUp value={d.stats.certificates} />}
            viz={<Award className="h-8 w-8" aria-hidden />}
            caption={
              d.stats.certificates === 0
                ? "Finish a course to earn one."
                : "Verified & shareable."
            }
          />

          <VibrantMetricCard
            icon={Flame}
            label="Streak"
            accent="vh-accent-streak"
            index={3}
            live={d.last7[d.last7.length - 1] > 0 && d.streakDetail.current > 0}
            href={d.active?.resumeHref ?? "/dashboard/learn/browse"}
            value={
              <>
                <CountUp value={d.streakDetail.current} />
                <span className="dc-unit">
                  {d.streakDetail.current === 1 ? "day" : "days"}
                </span>
              </>
            }
            viz={
              <HeatStrip
                values={d.last7}
                label={`Active ${d.last7.filter((v) => v > 0).length} of the last 7 days`}
              />
            }
            caption={
              d.streakDetail.current === 0
                ? "Start today."
                : d.streakDetail.atRisk
                  ? "A lesson today keeps it going."
                  : d.streakDetail.longest > d.streakDetail.current
                    ? `Best: ${d.streakDetail.longest} days`
                    : "Your best streak yet."
            }
          />
        </div>
      </section>

      {/* Overview / Activity tabs (analytics renders on-demand in the Activity tab) */}
      <Tabs
        items={[
          {
            value: "overview",
            label: "Overview",
            content: <Overview d={d} />,
          },
          {
            value: "activity",
            label: "Activity",
            content: (
              <ChartCard
                title="Learning activity — last 14 days"
                state={d.activityTotal === 0 ? "empty" : "ready"}
                emptyMessage="Your activity graph appears after your first completed lesson."
              >
                <div className="h-40">
                  <AreaChart
                    points={d.weeklyActivity}
                    color="var(--gs-green)"
                    height={150}
                    className="w-full"
                    label="Lessons completed per day"
                  />
                </div>
              </ChartCard>
            ),
          },
        ]}
      />

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickActionCard
            icon={PlayCircle}
            label="Continue learning"
            href={d.active?.resumeHref ?? "/dashboard/courses"}
            primary
          />
          <QuickActionCard
            icon={Compass}
            label="Explore courses"
            href="/dashboard/learn/browse"
          />
          {/* Referral is the cross-cutting Affiliate-layer affordance — hidden when Affiliate is off. */}
          {affiliateVisible && (
            <QuickActionCard
              icon={Share2}
              label="Refer a friend"
              href="/dashboard/earn"
            />
          )}
        </div>
      </section>
    </>
  );
}

function Overview({ d }: { d: LearnDashboard }) {
  return (
    <div className="space-y-8">
      {/* Your courses */}
      <section aria-label="Your courses" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-h4 font-bold text-ink">
            Your courses
          </h3>
          <Link
            href="/dashboard/courses"
            className="text-small font-semibold text-theme-strong"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {d.courses.map((c) => (
            <CourseCard
              key={c.slug}
              title={c.title}
              meta={`${c.completed} / ${c.total} lessons`}
              progress={c.percent}
              owned
              action={
                <Link href={`/dashboard/learn/${c.slug}`}>
                  <Button className="w-full">
                    {c.percent === 100
                      ? "Review"
                      : c.completed === 0
                        ? "Start"
                        : "Resume"}
                  </Button>
                </Link>
              }
            />
          ))}
        </div>
      </section>

      {/* Recommendations — real catalog courses you don't own yet (honest, no fake) */}
      {d.recommendations.length > 0 && (
        <section aria-label="Recommended" className="space-y-3">
          <h3 className="font-heading text-h4 font-bold text-ink">
            Recommended next
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {d.recommendations.map((c) => (
              <CourseCard
                key={c.slug}
                title={c.title}
                meta={c.summary ?? undefined}
                action={
                  <Link href={`/courses/${c.slug}`}>
                    <Button variant="outline" className="w-full">
                      View course
                    </Button>
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming webinar (opportunity, never a prerequisite) */}
      {d.webinar && (
        <Link
          href="/dashboard/learn/webinars"
          className="lift flex items-center gap-3 rounded-gs border border-line bg-surface-raised p-4"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info"
            aria-hidden
          >
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{d.webinar.title}</p>
            <p className="text-caption text-ink-muted">
              Live webinar — book your seat
            </p>
          </div>
          <span className="shrink-0 text-small font-semibold text-theme-strong">
            View →
          </span>
        </Link>
      )}
    </div>
  );
}

// ONE getting-started strip (ThreeState law) — sits ABOVE the full Learn dashboard for new learners.
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
        <Link href="/dashboard/learn/browse">
          <Button className="w-auto">Browse courses</Button>
        </Link>
      ),
    },
    {
      title: "Watch your first lesson",
      description: "Just 2 minutes to your first win.",
    },
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
