import * as React from "react";
import { cn } from "../../lib/utils";

export interface HeatStripProps {
  /** One value per day, oldest → newest (real activity counts — never fabricated, D-29). */
  values: number[];
  /** Accessible summary, e.g. "Active 3 of the last 7 days". */
  label: string;
  className?: string;
}

/**
 * Heatmap-lite activity strip (Experience System §9 "heatmap-lite" · Command_Center_Spec §5.2) —
 * one rounded cell per day, intensity from the real count, today = the rightmost cell. Inline SVG,
 * no lib, cheap enough for the first viewport. Colour inherits `currentColor` (the caller sets the
 * accent) and is never the only signal: the aria-label carries the meaning.
 */
export function HeatStrip({ values, label, className }: HeatStripProps) {
  if (!values || values.length === 0) return null;
  const cell = 12;
  const gap = 4;
  const width = values.length * cell + (values.length - 1) * gap;
  const max = Math.max(...values, 1);
  return (
    <svg
      viewBox={`0 0 ${width} ${cell}`}
      width={width}
      height={cell}
      role="img"
      aria-label={label}
      className={cn("shrink-0", className)}
    >
      {values.map((v, i) => (
        <rect
          key={i}
          x={i * (cell + gap)}
          y={0}
          width={cell}
          height={cell}
          rx={3.5}
          fill="currentColor"
          opacity={v <= 0 ? 0.12 : 0.35 + 0.65 * Math.min(v / max, 1)}
        />
      ))}
    </svg>
  );
}
