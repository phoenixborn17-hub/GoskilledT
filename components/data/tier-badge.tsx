import * as React from "react";
import { cn } from "../../lib/utils";

/** Recognition tiers (DR-034/035) — learning-first language, never earnings/team framing. */
export type Tier = "Contributor" | "Mentor" | "Community Champion";

export interface TierBadgeProps {
  tier: Tier;
  size?: number;
  className?: string;
}

// 5-point star path around (cx,cy) — the shared centre glyph.
function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return `M ${pts.join(" L ")} Z`;
}

/**
 * Tier medallion (DecisionCard_System §6 · Pass 2) — a DISTINCT inline-SVG shape per tier, not the
 * card's icon: Contributor = notched ring · Mentor = double ring · Champion = rayed sunburst. Gold
 * accent art (fills, gold-safe — never gold text, Rule 14); real tier only (D-29).
 */
export function TierBadge({ tier, size = 48, className }: TierBadgeProps) {
  const c = 24; // centre in the 48-unit viewBox
  const rings: React.ReactNode[] = [];

  if (tier === "Contributor") {
    // Single ring with a notched bezel.
    rings.push(
      <circle
        key="ring"
        cx={c}
        cy={c}
        r={17}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      />,
    );
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      rings.push(
        <line
          key={`n${i}`}
          x1={c + 18 * Math.cos(a)}
          y1={c + 18 * Math.sin(a)}
          x2={c + 21 * Math.cos(a)}
          y2={c + 21 * Math.sin(a)}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />,
      );
    }
  } else if (tier === "Mentor") {
    // Concentric double ring.
    rings.push(
      <circle
        key="r1"
        cx={c}
        cy={c}
        r={19}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />,
      <circle
        key="r2"
        cx={c}
        cy={c}
        r={14.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />,
    );
  } else {
    // Champion — rayed sunburst.
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI / 6) * i;
      rings.push(
        <line
          key={`ray${i}`}
          x1={c + 17 * Math.cos(a)}
          y1={c + 17 * Math.sin(a)}
          x2={c + 22 * Math.cos(a)}
          y2={c + 22 * Math.sin(a)}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />,
      );
    }
    rings.push(
      <circle
        key="ring"
        cx={c}
        cy={c}
        r={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      />,
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${tier} tier`}
      className={cn("shrink-0", className)}
      style={{ color: "var(--card-accent)" }}
    >
      <circle cx={c} cy={c} r={13} fill="currentColor" fillOpacity={0.16} />
      {rings}
      <path d={starPath(c, c, 6, 2.5)} fill="currentColor" />
    </svg>
  );
}
