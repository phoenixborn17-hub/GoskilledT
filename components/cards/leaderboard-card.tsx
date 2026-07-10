import * as React from "react";
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";

export interface LeaderboardCardProps {
  rank: number;
  name: string;
  avatarUrl?: string | null;
  /** The ranked metric — COMPLETED REFERRALS / contribution, never earnings or team size (DR-034/035). */
  metricLabel: string;
  metricValue: string;
  /** Recognition tier (Contributor → Mentor → Community Champion). */
  tier?: string;
  /** Highlight + pin the current user's own row (self-pin, §11). */
  isSelf?: boolean;
  className?: string;
}

/**
 * Leaderboard row (§10.2 · DR-034/035). Ranks by completed referrals / contribution with
 * learning-first recognition language. The current user's row is highlighted and labelled "You".
 */
export function LeaderboardCard({
  rank,
  name,
  avatarUrl,
  metricLabel,
  metricValue,
  tier,
  isSelf = false,
  className,
}: LeaderboardCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-gs border p-3",
        isSelf
          ? "border-theme/40 bg-theme/5"
          : "border-transparent hover:bg-surface-sunken",
        className,
      )}
    >
      <span
        className={cn(
          "w-7 shrink-0 text-center font-heading text-h4 font-bold tabular-nums",
          rank <= 3 ? "text-warning-strong" : "text-ink-muted",
        )}
      >
        {rank}
      </span>
      <Avatar name={name} src={avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-semibold text-ink">
          {name}
          {isSelf && (
            <span className="ml-2 align-middle">
              <Badge variant="brand">You</Badge>
            </span>
          )}
        </p>
        {tier && <p className="text-caption text-ink-muted">{tier}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-small font-bold tabular-nums text-ink">
          {metricValue}
        </p>
        <p className="text-caption text-ink-muted">{metricLabel}</p>
      </div>
    </div>
  );
}
