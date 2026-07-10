import * as React from "react";

export interface SparkDotProps {
  cx: number;
  cy: number;
  r?: number;
}

/**
 * "The Spark" — the GoSkilled signature mark (accent dot + soft breathing halo) placed on a viz's
 * LIVE EDGE: the ring/gauge arc endpoint, the network "you" node, the milestone target, the ledger
 * last-point. Semantic ("where you are now"), ~zero perf, D-29-clean. Uses `currentColor` so the
 * caller sets the accent; the halo pulse is `.dc-spark-halo` (static on low tier / reduced-motion).
 */
export function SparkDot({ cx, cy, r = 3.5 }: SparkDotProps) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r * 2.4}
        fill="currentColor"
        opacity={0.14}
        className="dc-spark-halo"
      />
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
    </g>
  );
}
