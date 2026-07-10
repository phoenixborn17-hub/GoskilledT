import * as React from "react";
import { Target } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { SemicircleGauge } from "../../data/semicircle-gauge";

export interface ProgressCardProps {
  percent: number;
  /** Real next milestone, e.g. "3 lessons to your certificate". */
  nextMilestone: string;
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Progress (green) — signature viz = semicircle gauge (replaces a bare "72%"). Hero = % + next
 * milestone. One CTA: View Progress.
 */
export function ProgressCard({
  percent,
  nextMilestone,
  aiLine,
  href,
  size = "secondary",
  index,
  state,
  onRetry,
}: ProgressCardProps) {
  return (
    <DecisionCard
      icon={Target}
      label="Overall progress"
      accent="green"
      size={size}
      aiLine={aiLine}
      cta="View progress"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-4">
        <SemicircleGauge value={percent} size={116} label="Overall progress" />
        <p className="min-w-0 flex-1 text-small text-ink-muted">
          {nextMilestone}
        </p>
      </div>
    </DecisionCard>
  );
}
