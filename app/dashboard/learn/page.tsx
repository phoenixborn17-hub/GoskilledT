// Learn workspace dashboard (Redesign U4 · Dashboard §3) — re-skinned onto the Decision Card
// system + Home-hub patterns. COMPOSITE over existing LMS data (no route/business-logic change).
// Action-first: Continue hero + ≤4 stat cards, then depth (Activity tab, recommendations, Guru).
// Zero-data → 3-step getting-started (never empty widgets, D-29).
import Link from "next/link";
import {
  BookOpen,
  Target,
  Award,
  Flame,
  PlayCircle,
  Share2,
  Sparkles,
  Compass,
  CalendarDays,
  Rocket,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import {
  getLearnDashboard,
  type LearnDashboard,
} from "../../../lib/learn/dashboard";
import { safeCount } from "../../../lib/format";

import { Button } from "../../../components/ui/button";
import { Tabs } from "../../../components/ui/tabs";
import { StatCard } from "../../../components/cards/stat-card";
import { ChartCard } from "../../../components/cards/chart-card";
import { CourseCard } from "../../../components/cards/course-card";
import { QuickActionCard } from "../../../components/cards/quick-action-card";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { ContinueLearningCard } from "../../../components/cards/decision/continue-learning-card";
import { AreaChart } from "../../../components/data/area-chart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Learn" };

const GOAL_SUBLINE: Record<string, string> = {
  SKILL: "Let's sharpen a skill today.",
  INCOME: "Real skills come first — keep building.",
  BOTH: "Keep learning at your own pace.",
};

export default async function LearnPage() {
  const user = await getCurrentUser();
  const d = await getLearnDashboard(user!.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-h1 font-extrabold text-ink">
          Your learning{d.name ? `, ${d.name}` : ""}
        </h1>
        <p className="mt-1 text-body text-ink-muted">
          {(d.goal && GOAL_SUBLINE[d.goal]) ?? "Continue where you left off."}
        </p>
      </header>

      {d.lifecycleNew ? <ZeroData /> : <Loaded d={d} />}
    </div>
  );
}

function Loaded({ d }: { d: LearnDashboard }) {
  const remaining = d.active ? d.active.total - d.active.completed : 0;
  const heroAi =
    d.active && d.active.percent > 0 && remaining > 0
      ? `You're ${d.active.percent}% through — ${remaining} ${remaining === 1 ? "lesson" : "lessons"} to your certificate.`
      : null;

  return (
    <>
      {/* Continue hero (action-first, first viewport) */}
      {d.active ? (
        <ContinueLearningCard
          href={d.active.resumeHref}
          courseTitle={d.active.title}
          lessonLabel={`${d.active.completed} / ${d.active.total} lessons`}
          percent={d.active.percent}
          aiLine={heroAi}
        />
      ) : null}

      {/* ≤4 stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Courses"
          value={safeCount(d.stats.courses)}
          icon={BookOpen}
          family="learning"
        />
        <StatCard
          label="Overall progress"
          value={safeCount(d.stats.overallPercent)}
          icon={Target}
          family="learning"
          hint="% across your courses"
        />
        <StatCard
          label="Certificates"
          value={safeCount(d.stats.certificates)}
          icon={Award}
          family="learning"
        />
        <StatCard
          label="Streak"
          value={safeCount(d.stats.streak)}
          icon={Flame}
          family="learning"
          hint={d.stats.streak === 1 ? "day" : "days"}
        />
      </div>

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
            href="/courses"
          />
          <QuickActionCard
            icon={Share2}
            label="Refer a friend"
            href="/dashboard/earn"
          />
          <QuickActionCard
            icon={Sparkles}
            label="Ask Guru"
            href={guruHref(d)}
          />
        </div>
      </section>

      {d.active && <GuruChips slug={d.active.slug} />}
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
          href="/webinar"
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

// Guru in-context chips (GPS-M5 §1E) — deep-link to the real in-lesson Guru with a ready doubt.
function GuruChips({ slug }: { slug: string }) {
  const chips = [
    "Is lesson ka main concept simple words me samjhao.",
    "Ek real-life example do is topic ka.",
    "Mujhe is chapter ka quick summary chahiye.",
  ];
  return (
    <section aria-label="Ask Guru" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-info" aria-hidden />
        <h2 className="font-heading text-h4 font-bold text-ink">Ask Guru</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c}
            href={`/dashboard/learn/${slug}?guru=1&q=${encodeURIComponent(c)}`}
            className="press inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info/5 px-3 py-1.5 text-small font-medium text-ink transition-colors hover:bg-info/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-info" aria-hidden />
            {c}
          </Link>
        ))}
      </div>
    </section>
  );
}

function guruHref(d: LearnDashboard): string {
  return d.active
    ? `/dashboard/learn/${d.active.slug}?guru=1`
    : "/dashboard/courses";
}

function ZeroData() {
  return (
    <GettingStartedCard
      icon={Rocket}
      subtitle="3 quick steps to your first win"
      steps={[
        {
          title: "Pick your first course",
          description: "Browse the catalog and choose what to learn.",
          action: (
            <Link href="/courses">
              <Button className="w-auto">Browse courses</Button>
            </Link>
          ),
        },
        {
          title: "Watch your first lesson",
          description: "Just 2 minutes to your first win.",
        },
        { title: "Share your referral link with a friend" },
      ]}
    />
  );
}
