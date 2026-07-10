import * as React from "react";
import { cn } from "../../lib/utils";
import { SparkDot } from "./spark";

export interface NetworkNodesProps {
  /** Real active-referral count. Up to 6 satellites are drawn; the rest surface as "+N". */
  count: number;
  /** Real joins this month — the newest satellites render with a highlight ring (data-driven). */
  newCount?: number;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}

/**
 * Mini network-node graphic (DecisionCard_System §6 — Network family). A central "you" node with
 * satellites drawn from the REAL active-referral count (capped at 6 visually; overflow shown as
 * +N). Not a fabricated graph — 0 referrals draws the lone centre node (honest, D-29).
 */
export function NetworkNodes({
  count,
  newCount = 0,
  width = 200,
  height = 96,
  className,
  label,
}: NetworkNodesProps) {
  const cx = width / 2;
  const cy = height / 2;
  const visible = Math.max(0, Math.min(6, count));
  const overflow = Math.max(0, count - 6);
  // The newest `newCount` satellites (drawn last) get a highlight ring.
  const ringedFrom = visible - Math.min(newCount, visible);
  const radius = Math.min(width, height * 2) / 2 - 14;

  const nodes = Array.from({ length: visible }).map((_, i) => {
    // Fan the satellites across the top arc so they read as an outward network.
    const angle = Math.PI * (0.15 + (0.7 * i) / Math.max(visible - 1, 1));
    return {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle) * 0.9,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={label ?? `${count} active referrals`}
      className={cn("overflow-visible", className)}
      style={{ color: "var(--card-accent)" }}
    >
      {nodes.map((n, i) => (
        <line
          key={`l-${i}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.35}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={`n-${i}`} className="dc-pop">
          {i >= ringedFrom && (
            <circle
              cx={n.x}
              cy={n.y}
              r={8}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              opacity={0.5}
            />
          )}
          <circle cx={n.x} cy={n.y} r={5} fill="currentColor" opacity={0.6} />
        </g>
      ))}
      {/* The "you" node is the Spark — the live centre of the network. */}
      <SparkDot cx={cx} cy={cy} r={5} />
      {overflow > 0 && (
        <text
          x={width - 6}
          y={height - 4}
          textAnchor="end"
          className="fill-ink-muted text-[10px] font-semibold"
        >
          +{overflow}
        </text>
      )}
    </svg>
  );
}
