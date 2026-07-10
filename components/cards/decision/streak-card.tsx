import * as React from "react";
import { Flame as FlameIcon } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { Flame } from "../../data/flame";
import { StatValue } from "../../data/stat-value";

export interface StreakCardProps {
  days: number;
  /** Streak expires today — framed supportively ("keep it going"), never as loss-anxiety. */
  atRisk?: boolean;
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Streak (gold) — signature viz = the flame (glow pulses on capable tier only). Day count counts up
 * (non-money). Supportive framing. One CTA: Learn today.
 */
export function StreakCard({
  days,
  atRisk = false,
  aiLine,
  href,
  size = "secondary",
  index,
  state,
  onRetry,
}: StreakCardProps) {
  return (
    <DecisionCard
      icon={FlameIcon}
      label="Your streak"
      accent="green"
      size={size}
      badge={atRisk ? { label: "Keep it up", tone: "hot" } : undefined}
      aiLine={aiLine}
      cta="Learn today"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-4">
        <Flame days={days} atRisk={atRisk} />
        <div>
          <div className="dc-number text-h1 font-bold text-ink">
            <StatValue value={days} countUp />
          </div>
          <p className="text-caption text-ink-muted">
            {days === 1 ? "day" : "days"} in a row
          </p>
        </div>
      </div>
    </DecisionCard>
  );
}
