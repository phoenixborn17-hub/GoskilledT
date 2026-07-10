import * as React from "react";
import { cn } from "../../lib/utils";

export interface SparklineProps {
  /** Real data points. The ≥3-points rule (Amendments §G / Experience System §9) is enforced:
   *  fewer than 3 points renders nothing — the caller shows a stat + "graph appears after…". */
  points: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Accessible description of the trend. */
  label?: string;
}

/**
 * Inline-SVG sparkline (Experience System §9) — no chart lib, cheap enough for critical routes.
 * Real data only; never a decorative fake curve (D-29). Returns null below 3 points so a
 * meaningless 1–2 point "line" is never drawn.
 */
export function Sparkline({
  points,
  width = 120,
  height = 36,
  className,
  label,
}: SparklineProps) {
  if (!points || points.length < 3) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={label ?? "Trend"}
      preserveAspectRatio="none"
    >
      <polygon points={area} className="fill-theme/10" />
      <polyline
        points={line}
        fill="none"
        className="stroke-theme"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
