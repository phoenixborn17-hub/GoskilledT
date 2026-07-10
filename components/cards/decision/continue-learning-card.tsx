import * as React from "react";
import { PlayCircle } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { ProgressRing } from "../../data/progress-ring";

export interface ContinueLearningCardProps {
  courseTitle: string;
  lessonLabel: string;
  percent: number;
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Continue-Learning (green) — the "pick up where you left off" card. Context-as-hero (course +
 * lesson), signature viz = progress ring. One CTA: Resume.
 */
export function ContinueLearningCard({
  courseTitle,
  lessonLabel,
  percent,
  aiLine,
  href,
  size = "hero",
  index,
  state,
  onRetry,
}: ContinueLearningCardProps) {
  return (
    <DecisionCard
      icon={PlayCircle}
      label="Continue learning"
      accent="green"
      size={size}
      badge={{ label: "In progress", tone: "new" }}
      aiLine={aiLine}
      cta="Resume"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-balance font-heading text-h2 font-bold leading-tight text-ink md:text-display">
            {courseTitle}
          </h3>
          <p className="mt-2 text-body text-ink-muted">{lessonLabel}</p>
        </div>
        <ProgressRing
          value={percent}
          size={104}
          strokeWidth={10}
          spark
          label={`${courseTitle} progress`}
          className="shrink-0"
        />
      </div>
    </DecisionCard>
  );
}
