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

export interface SparkProps {
  /** Dot diameter in px (halo scales with it). */
  size?: number;
  className?: string;
}

/**
 * The Spark as a DOM mark (Command_Center_Spec §1.2 R3 / §5.7) — the same signature outside SVG,
 * for the four sanctioned placements: greeting bullet · switcher pip · metric live-edge · (later)
 * ring endpoint via SparkDot. `currentColor` so the caller sets the accent; the halo breathes via
 * `.dc-spark-halo` (motion-safe only — reduced-motion/low tier see a static dot). Decorative:
 * always `aria-hidden` — an honest trigger's MEANING must also exist as text for AT users.
 */
export function Spark({ size = 6, className }: SparkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="dc-spark-halo absolute rounded-full"
        style={{
          width: size * 2.4,
          height: size * 2.4,
          background: "currentColor",
          opacity: 0.14,
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: "currentColor" }}
      />
    </span>
  );
}
