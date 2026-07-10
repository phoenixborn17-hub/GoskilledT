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
  /** Gradient area fill (Analytics). Set false for the Wallet "passbook rule" line-only ledger. */
  fill?: boolean;
  className?: string;
  label?: string;
}

/**
 * Area / line chart (DecisionCard_System §6 · Pass 2). Analytics owns the gradient AREA fill;
 * Wallet passes `fill={false}` for a line-only "passbook rule" ledger (de-twinned). The line draws
 * in via `pathLength=1` (no dead-time on short paths). The Spark (live edge) is an HTML overlay so
 * it stays a perfect circle even though the SVG stretches (`preserveAspectRatio="none"`). Real data
 * only (D-29).
 */
export function AreaChart({
  points,
  width = 260,
  height = 88,
  color = "var(--card-accent)",
  fill = true,
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
  // Spark position as % of the container (SVG stretches to fill, so coords map linearly).
  const sparkLeft = (lastX / width) * 100;
  const sparkTop = (lastY / height) * 100;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={label ?? "Trend over time"}
        className="overflow-visible"
        style={{ color }}
      >
        {fill && (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${gradientId})`} />
          </>
        )}
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="dc-draw"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* The Spark (live edge) — HTML overlay, always a round dot regardless of SVG stretch. */}
      <span
        className="pointer-events-none absolute flex items-center justify-center"
        style={{
          left: `${sparkLeft}%`,
          top: `${sparkTop}%`,
          transform: "translate(-50%, -50%)",
          color,
        }}
        aria-hidden
      >
        <span
          className="dc-spark-halo absolute h-4 w-4 rounded-full"
          style={{ background: "currentColor", opacity: 0.14 }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "currentColor" }}
        />
      </span>
    </div>
  );
}
