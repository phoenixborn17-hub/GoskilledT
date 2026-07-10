"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface AreaChartProps {
  /** Real data points. ≥3-points rule (§6): fewer renders nothing — caller shows a stat + honest line. */
  points: number[];
  width?: number;
  height?: number;
  /** Accent colour; defaults to the card accent so it themes per family. */
  color?: string;
  className?: string;
  label?: string;
}

/**
 * Area chart (DecisionCard_System §6) — gradient fill + animated draw-in (`.dc-draw`, device-tier
 * gated) + last-point highlight. Inline SVG, real data only (D-29). Themes to `var(--card-accent)`.
 */
export function AreaChart({
  points,
  width = 260,
  height = 88,
  color = "var(--card-accent)",
  className,
  label,
}: AreaChartProps) {
  const gradientId = React.useId();
  if (!points || points.length < 3) return null;

  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (p - min) / range);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? "Trend over time"}
      className={cn("overflow-visible", className)}
      style={{ color }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dc-draw"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={6} fill="currentColor" opacity={0.15} />
      <circle
        cx={lastX}
        cy={lastY}
        r={3.25}
        fill="currentColor"
        className="dc-pop"
      />
    </svg>
  );
}
