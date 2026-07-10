import * as React from "react";
import { cn } from "../../lib/utils";

export interface NetworkNodesProps {
  /** Real active-referral count. Up to 6 satellites are drawn; the rest surface as "+N". */
  count: number;
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
  width = 200,
  height = 96,
  className,
  label,
}: NetworkNodesProps) {
  const cx = width / 2;
  const cy = height / 2;
  const visible = Math.max(0, Math.min(6, count));
  const overflow = Math.max(0, count - 6);
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
        <circle
          key={`n-${i}`}
          cx={n.x}
          cy={n.y}
          r={5}
          fill="currentColor"
          opacity={0.55}
          className="dc-pop"
        />
      ))}
      <circle cx={cx} cy={cy} r={12} fill="currentColor" opacity={0.12} />
      <circle cx={cx} cy={cy} r={8} fill="currentColor" />
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
