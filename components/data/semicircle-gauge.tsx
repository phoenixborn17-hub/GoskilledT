import * as React from "react";
import { cn } from "../../lib/utils";
import { SparkDot } from "./spark";

export interface SemicircleGaugeProps {
  /** 0–100. Clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Centre content (defaults to the rounded %). */
  children?: React.ReactNode;
  className?: string;
  label?: string;
  /** Milestone tick fractions (0–1) on the track — de-twins the gauge from Continue's ring. */
  ticks?: number[];
}

// Point on the TOP semicircle at fraction f (0=left, 1=right), centre (cx, cy), radius r.
function arcPoint(cx: number, cy: number, r: number, f: number) {
  const phi = Math.PI * (1 - f); // left(π) → right(0)
  return { x: cx + r * Math.cos(phi), y: cy - r * Math.sin(phi) };
}

/**
 * Semicircle gauge (DecisionCard_System §6 — the Progress family's signature viz). Replaces a bare
 * "72%". Accent arc fills via stroke-dashoffset; the Spark marks the live edge (arc endpoint); real
 * milestone ticks sit on the track. Reduced-motion sees the final arc.
 */
export function SemicircleGauge({
  value,
  size = 120,
  strokeWidth = 10,
  children,
  className,
  label,
  ticks = [0.25, 0.5, 0.75],
}: SemicircleGaugeProps) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLen = Math.PI * r; // half circumference
  const offset = arcLen * (1 - pct / 100);
  const height = size / 2 + strokeWidth / 2;
  const spark = arcPoint(cx, cy, r, pct / 100);

  return (
    <div
      className={cn("relative inline-flex", className)}
      style={{ width: size, height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <svg width={size} height={height}>
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-n-150"
        />
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={offset}
          className="stroke-[color:var(--card-accent)] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-slow motion-safe:ease-standard"
        />
        {ticks.map((f, i) => {
          const p = arcPoint(cx, cy, r, f);
          return (
            <circle key={i} cx={p.x} cy={p.y} r={1.75} className="fill-white" />
          );
        })}
        {pct > 0 && (
          <g style={{ color: "var(--card-accent)" }}>
            <SparkDot cx={spark.x} cy={spark.y} />
          </g>
        )}
      </svg>
      <span className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-heading text-h3 font-bold tabular-nums text-ink">
          {children ?? `${Math.round(pct)}%`}
        </span>
      </span>
    </div>
  );
}
