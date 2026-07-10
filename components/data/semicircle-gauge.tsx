import * as React from "react";
import { cn } from "../../lib/utils";

export interface SemicircleGaugeProps {
  /** 0–100. Clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Centre content (defaults to the rounded %). */
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

/**
 * Semicircle gauge (DecisionCard_System §6 — the Progress family's signature viz). Replaces a bare
 * "72%". Accent arc fills via stroke-dashoffset transition (reduced-motion sees the final arc).
 */
export function SemicircleGauge({
  value,
  size = 120,
  strokeWidth = 10,
  children,
  className,
  label,
}: SemicircleGaugeProps) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const cy = size / 2;
  const arcLen = Math.PI * r; // half circumference
  const offset = arcLen * (1 - pct / 100);
  const height = size / 2 + strokeWidth / 2;

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
      </svg>
      <span className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-heading text-h3 font-bold tabular-nums text-ink">
          {children ?? `${Math.round(pct)}%`}
        </span>
      </span>
    </div>
  );
}
