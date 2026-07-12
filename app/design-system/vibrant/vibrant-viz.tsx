// v4 mini-viz (mockup-local, server-safe). Real values only — an all-zero series renders honest
// baseline stubs, never a fabricated shape (D-29). `currentColor` so the card accent colors it.
import * as React from "react";

/** Tiny vertical bar cluster (per-course %, network levels, etc.). */
export function MiniBars({
  values,
  label,
  max,
  height = 34,
}: {
  values: number[];
  label: string;
  /** Scale ceiling; defaults to the series max (min 1 so zeros render stubs). */
  max?: number;
  height?: number;
}) {
  if (!values || values.length === 0) return null;
  const bar = 8;
  const gap = 5;
  const width = values.length * bar + (values.length - 1) * gap;
  const ceil = Math.max(max ?? Math.max(...values), 1);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      {values.map((v, i) => {
        const h = Math.max(3, Math.round((v / ceil) * height));
        return (
          <rect
            key={i}
            x={i * (bar + gap)}
            y={height - h}
            width={bar}
            height={h}
            rx={2.5}
            fill="currentColor"
            opacity={v <= 0 ? 0.22 : 0.45 + 0.55 * Math.min(v / ceil, 1)}
          />
        );
      })}
    </svg>
  );
}
