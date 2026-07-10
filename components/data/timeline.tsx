import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface TimelineEvent {
  id: string;
  icon: LucideIcon;
  title: React.ReactNode;
  /** Relative/absolute time string (real). */
  time?: string;
  description?: React.ReactNode;
  /** Accent the node (e.g. success for a certificate, warning for attention). */
  tone?: "brand" | "success" | "warning" | "muted";
}

const toneClass: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  brand: "bg-theme/10 text-theme-strong",
  success: "bg-success/10 text-success",
  warning: "bg-warning-strong/10 text-warning-strong",
  muted: "bg-charcoal/5 text-ink-muted",
};

/**
 * Vertical activity timeline (Home Activity Feed, referral/relationship timelines). Real composed
 * events only; the empty state is owned by the wrapping <WidgetContainer> (never a fake row).
 */
export function Timeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-1", className)}>
      {events.map((event, i) => {
        const Icon = event.icon;
        const last = i === events.length - 1;
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  toneClass[event.tone ?? "brand"],
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              {!last && <span className="w-px flex-1 bg-line" aria-hidden />}
            </div>
            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-4")}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-small font-medium text-ink">{event.title}</p>
                {event.time && (
                  <span className="shrink-0 text-caption text-ink-muted">
                    {event.time}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="mt-0.5 text-caption text-ink-muted">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
