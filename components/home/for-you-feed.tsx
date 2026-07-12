// "For you today" (Command_Center_Spec §2.6) — ONE stream: rules-driven next-best-action nudges
// first (composed by the page from real summary state), then the recent-activity tail (real events
// only — lesson completions, certificates, L1 joins when the Affiliate layer is visible). Streamed
// below the first viewport. Celebratory honest empty ("all caught up"), never a fabricated row.
import {
  CalendarDays,
  Flame,
  PlayCircle,
  Award,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getRecentActivity, relativeDayLabel } from "../../lib/home/feed";
import { NotificationCard } from "../cards/notification-card";
import { WidgetContainer } from "../data/widget-container";

export interface FeedNudge {
  icon: "webinar" | "streak" | "resume";
  title: string;
  description: string;
  time: string;
  tone: "info" | "warning" | "brand";
  href: string;
}

const nudgeIcon: Record<FeedNudge["icon"], LucideIcon> = {
  webinar: CalendarDays,
  streak: Flame,
  resume: PlayCircle,
};

const eventIcon: Record<string, LucideIcon> = {
  lesson: PlayCircle,
  certificate: Award,
  referral: Users,
};

export async function ForYouFeed({
  userId,
  nudges,
}: {
  userId: string;
  nudges: FeedNudge[];
}) {
  const activity = await getRecentActivity(userId, 3);
  const total = nudges.length + activity.length;

  return (
    <WidgetContainer
      title="For you today"
      state={total === 0 ? "empty" : "ready"}
      empty={{
        icon: Sparkles,
        title: "You're all caught up",
        description: "New nudges will show up here as you learn and share.",
      }}
    >
      <div className="space-y-1">
        {nudges.slice(0, 3).map((n, i) => (
          <NotificationCard
            key={`nudge-${i}`}
            icon={nudgeIcon[n.icon]}
            title={n.title}
            description={n.description}
            time={n.time}
            tone={n.tone}
            href={n.href}
          />
        ))}
        {activity.map((e, i) => (
          <NotificationCard
            key={`event-${i}`}
            icon={eventIcon[e.kind] ?? PlayCircle}
            title={e.title}
            description={e.description}
            time={relativeDayLabel(e.at)}
            tone={e.kind === "certificate" ? "success" : "brand"}
          />
        ))}
      </div>
    </WidgetContainer>
  );
}

/** Suspense fallback — mirrors the widget footprint (zero CLS). */
export function ForYouFeedSkeleton() {
  return (
    <div
      aria-hidden
      className="h-40 rounded-gs-lg border border-line bg-surface-raised motion-safe:animate-pulse"
    />
  );
}
