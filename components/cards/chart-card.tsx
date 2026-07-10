import * as React from "react";
import { LineChart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { ErrorState } from "../ui/error-state";
import { EmptyState } from "../ui/empty-state";

export interface ChartCardProps {
  title: React.ReactNode;
  /** Filters/date-range control slot. */
  action?: React.ReactNode;
  state?: "loading" | "ready" | "empty" | "error";
  /** Honest empty copy — the ≥3-points rule (§9): show this, never a fabricated 1–2 point graph. */
  emptyMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Chart wrapper (Experience System §9 · Analytics family). Every chart gets a title, a skeleton
 * loading state, a calm error+retry, and — critically — an HONEST empty state for the ≥3-data-point
 * rule: below 3 points the caller sets state="empty" and we show "graph appears after…", never a
 * decorative fake curve (D-29). Heavy chart libs lazy-load into `children`.
 */
export function ChartCard({
  title,
  action,
  state = "ready",
  emptyMessage = "This graph appears once you have a few data points.",
  onRetry,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-heading text-h4 font-semibold text-ink">{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {state === "loading" && <Skeleton className="h-40 w-full" />}
      {state === "error" && <ErrorState onRetry={onRetry} className="py-8" />}
      {state === "empty" && (
        <EmptyState
          icon={LineChart}
          title="Not enough data yet"
          description={emptyMessage}
          className="py-8"
        />
      )}
      {state === "ready" && children}
    </Card>
  );
}
