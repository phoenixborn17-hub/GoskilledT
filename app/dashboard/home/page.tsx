// GoSkilled Home hub (Redesign U3 · Dashboard §2) — COMPOSITE: reads/composes existing data only,
// no new money/business logic. Action-first: greeting + Today's Summary + primary CTA render from a
// composed server payload (first viewport); Enter-Workspace snapshots stream below (Amendments §F).
// Zero-data → getting-started, never empty widgets (D-29). Built on the Decision Card system.
import { Suspense, type ComponentProps } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Wallet,
  PlayCircle,
  Share2,
  Sparkles,
  Rocket,
  Flame,
  BookOpen,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { getHomeSummary, type HomeSummary } from "../../../lib/home/summary";
import { safeMoney } from "../../../lib/format";
import { format } from "date-fns";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { WidgetContainer } from "../../../components/data/widget-container";
import { DataValue } from "../../../components/data/data-value";
import { NotificationCard } from "../../../components/cards/notification-card";
import { QuickActionCard } from "../../../components/cards/quick-action-card";
import { AnnouncementBanner } from "../../../components/cards/announcement-banner";
import { ShareWidget } from "../../../components/cards/share-widget";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { BentoGrid, BentoItem } from "../../../components/cards/decision/bento";
import { ContinueLearningCard } from "../../../components/cards/decision/continue-learning-card";
import { StreakCard } from "../../../components/cards/decision/streak-card";
import {
  EnterWorkspaces,
  EnterWorkspacesSkeleton,
} from "../../../components/home/enter-workspaces";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await getCurrentUser();
  const summary = await getHomeSummary(user!.id);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-h1 font-extrabold text-ink">
            {summary.greetingTitle}
          </h1>
          <Badge variant="gold">Founding Batch</Badge>
        </div>
        <p className="mt-1 text-body text-ink-muted">
          {summary.greetingMessage}
        </p>
      </header>

      {summary.lifecycleNew ? (
        <ZeroData summary={summary} />
      ) : (
        <>
          <TodaysSummary summary={summary} />
          <QuickActions summary={summary} />
          <Priorities summary={summary} />
          <Suspense fallback={<EnterWorkspacesSkeleton />}>
            <EnterWorkspaces userId={user!.id} />
          </Suspense>
          <Announcements />
          <ShareSection shareUrl={summary.shareUrl} />
        </>
      )}
    </div>
  );
}

// ── First viewport: Today's Summary (composed payload) ──────────────────────────
function TodaysSummary({ summary }: { summary: HomeSummary }) {
  const { nextLesson, streak, webinarToday, walletAvailablePaise } = summary;
  return (
    <section aria-label="Today's summary">
      <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
        Today&apos;s summary
      </h2>
      <BentoGrid>
        <BentoItem size="hero">
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

        {streak.current > 0 && (
          <BentoItem size="secondary">
            <StreakCard
              href="/dashboard/learn"
              days={streak.current}
              atRisk={streak.atRisk}
            />
          </BentoItem>
        )}

        {webinarToday && (
          <BentoItem size="secondary">
            <DecisionCard
              icon={CalendarDays}
              label="Today's webinar"
              accent="info"
              size="secondary"
              badge={{ label: "Today", tone: "live" }}
              cta="Join webinar"
              href="/webinar"
            >
              <div>
                <p className="font-heading text-h4 font-bold text-ink">
                  {webinarToday.title}
                </p>
                <p className="mt-1 text-small text-ink-muted">
                  {format(webinarToday.startsAt, "h:mm a")}
                </p>
              </div>
            </DecisionCard>
          </BentoItem>
        )}

        {walletAvailablePaise != null && (
          <BentoItem size="secondary">
            <DecisionCard
              icon={Wallet}
              label="Available"
              accent="gold"
              size="secondary"
              cta="View Wallet"
              href="/dashboard/earn/wallet"
            >
              <div className="dc-number text-h1 font-bold text-ink">
                <DataValue value={safeMoney(walletAvailablePaise)} raiseUnit />
              </div>
            </DecisionCard>
          </BentoItem>
        )}
      </BentoGrid>
    </section>
  );
}

// ── Contextual Quick Actions (≤4, rules-driven) ─────────────────────────────────
function QuickActions({ summary }: { summary: HomeSummary }) {
  const actions = [
    {
      icon: PlayCircle,
      label: "Continue learning",
      href: summary.nextLesson?.href ?? "/dashboard/learn",
      primary: true,
    },
    { icon: Share2, label: "Refer a friend", href: "/dashboard/earn" },
    ...(summary.webinarToday
      ? [{ icon: CalendarDays, label: "Join webinar", href: "/webinar" }]
      : []),
    { icon: Sparkles, label: "Ask Guru", href: "/dashboard/learn" },
  ].slice(0, 4);

  return (
    <section aria-label="Quick actions">
      <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((a) => (
          <QuickActionCard
            key={a.label}
            icon={a.icon}
            label={a.label}
            href={a.href}
            primary={"primary" in a && a.primary}
          />
        ))}
      </div>
    </section>
  );
}

// ── Priority notifications — rules over real state only (never fabricated, D-29) ─
function Priorities({ summary }: { summary: HomeSummary }) {
  const items: ComponentProps<typeof NotificationCard>[] = [];
  if (summary.webinarToday) {
    items.push({
      icon: CalendarDays,
      title: "Live webinar today",
      description: `Starts at ${format(summary.webinarToday.startsAt, "h:mm a")}`,
      time: "Today",
      tone: "info",
      href: "/webinar",
    });
  }
  if (summary.streak.atRisk) {
    items.push({
      icon: Flame,
      title: "Keep your streak alive",
      description: "A 2-minute lesson today keeps it going.",
      time: "Today",
      tone: "warning",
      href: summary.nextLesson?.href ?? "/dashboard/learn",
    });
  }

  return (
    <WidgetContainer
      title="For you today"
      state={items.length === 0 ? "empty" : "ready"}
      empty={{
        icon: Sparkles,
        title: "You're all caught up",
        description: "New nudges will show up here as you learn and share.",
      }}
    >
      <div className="space-y-1">
        {items.map((it, i) => (
          <NotificationCard key={i} {...it} />
        ))}
      </div>
    </WidgetContainer>
  );
}

// ── Announcements — admin CMS [Phase F-Admin] → a truthful static fallback (never fake) ──
function Announcements() {
  return (
    <AnnouncementBanner
      dismissible
      title="Welcome to the Founding Batch"
      description="You're getting early access as GoSkilled grows — new courses are on the way."
    />
  );
}

// ── Share ────────────────────────────────────────────────────────────────────────
function ShareSection({ shareUrl }: { shareUrl: string }) {
  return (
    <ShareWidget
      link={shareUrl}
      whatsappMessage={`Main GoSkilled par seekh raha hoon — tu bhi join kar: ${shareUrl}`}
    />
  );
}

// ── Zero-data first run (Dashboard §7) — getting-started, never empty widgets ─────
function ZeroData({ summary }: { summary: HomeSummary }) {
  return (
    <div className="space-y-6">
      <GettingStartedCard
        icon={Rocket}
        subtitle="3 quick steps to your first win"
        steps={[
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
          { title: "Share your referral link with a friend" },
        ]}
      />
      <ShareSection shareUrl={summary.shareUrl} />
    </div>
  );
}
