import * as React from "react";
import { Gift } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { ProgressRing } from "../data/progress-ring";

export interface RewardCardProps {
  title: string;
  description?: string;
  /** Real progress toward the admin-defined target (0–100). */
  progress: number;
  /** e.g. "12 of 20 referrals" — real counts, learning-first language (DR-034/035). */
  progressLabel?: string;
  lastDate?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reward milestone (Reward family, §10.2 · gold + celebration). Admin-defined targets; real
 * progress only ("no active reward" empty state owned by the wrapper). Recognition language stays
 * learning-first — never earnings/team framing (DR-035).
 */
export function RewardCard({
  title,
  description,
  progress,
  progressLabel,
  lastDate,
  action,
  className,
}: RewardCardProps) {
  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="flex items-center gap-4">
        <ProgressRing value={progress} size={64} label={`${title} progress`}>
          <Gift className="h-5 w-5 text-warning-strong" aria-hidden />
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-h4 font-bold text-ink">{title}</h3>
          {description && (
            <p className="mt-0.5 text-caption text-ink-muted">{description}</p>
          )}
          {progressLabel && (
            <p className="mt-1 text-small font-semibold text-ink">
              {progressLabel}
            </p>
          )}
          {lastDate && (
            <p className="mt-0.5 text-caption text-ink-muted">
              Ends {lastDate}
            </p>
          )}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
