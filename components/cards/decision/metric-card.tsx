import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  DecisionCard,
  type CardAccent,
  type DecisionCardProps,
} from "./decision-card";

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  accent?: CardAccent;
  /** The metric value — a node so money renders through <DataValue> (safeMoney, never ₹0-on-fail)
   *  and viz-values (a ring) can sit beside it. Styled `.dc-number` by the card. */
  value: React.ReactNode;
  /** Optional unit rendered inside the value line (callers usually bake it into `value`). */
  valueClassName?: string;
  /** Mini-viz slot (ring · heat-strip · sparkline · seal). Rendered beside/below the value. */
  viz?: React.ReactNode;
  /** One honest context line under the value: a real delta ("2 lessons this week") for active
   *  users, or the ThreeState unlock micro-line at honest zero. Omitted when null (D-29). */
  caption?: string | null;
  badge?: DecisionCardProps["badge"];
  /** Live-edge Spark on the label (honest trigger only — see DecisionCard). */
  live?: boolean;
  href?: string;
  state?: DecisionCardProps["state"];
  index?: number;
  className?: string;
}

/**
 * MetricCard (Command_Center_Spec §2.4 / §5.2) — the Home key-metric row card. NOT a new card
 * system: a thin composition over the DecisionCard shell (`size="metric"`), so depth, hover,
 * device-tiering, honest loading/error states, and a11y are inherited. Anatomy: icon plate +
 * label (+ optional live Spark / badge) → `.dc-number` value with a mini-viz beside it → one
 * honest caption (delta or unlock line). Rich info-component, never a bare number-in-a-box.
 */
export function MetricCard({
  icon,
  label,
  accent = "green",
  value,
  valueClassName,
  viz,
  caption,
  badge,
  live = false,
  href,
  state,
  index,
  className,
}: MetricCardProps) {
  return (
    <DecisionCard
      icon={icon}
      label={label}
      accent={accent}
      size="metric"
      badge={badge}
      live={live}
      href={href}
      state={state}
      index={index}
      className={className}
    >
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-end justify-between gap-3">
          <div
            className={cn(
              "dc-number text-h2 font-bold leading-none text-ink md:text-h1",
              valueClassName,
            )}
          >
            {value}
          </div>
          {viz && (
            <div className="shrink-0 pb-0.5 text-[var(--card-accent)]">
              {viz}
            </div>
          )}
        </div>
        {caption ? (
          <p className="text-caption leading-snug text-ink-muted">{caption}</p>
        ) : null}
      </div>
    </DecisionCard>
  );
}
