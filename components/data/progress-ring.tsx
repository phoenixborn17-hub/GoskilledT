import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressRingProps {
  /** 0–100. Clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Centre content (defaults to the rounded percentage). */
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

/**
 * Circular progress (course completion, reward progress). Uses the workspace `theme` stroke; the
 * arc animates via stroke-dashoffset transition (reduced-motion users see the final arc instantly —
 * the transition is CSS `duration-slow` and the ring paints filled on first render, no JS).
 */
export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 8,
  children,
  className,
  label,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div
      className={cn("relative inline-flex", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-n-150"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-theme motion-safe:transition-[stroke-dashoffset] motion-safe:duration-slow motion-safe:ease-standard"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-small font-bold tabular-nums text-ink">
        {children ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}
