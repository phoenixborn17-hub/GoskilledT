import * as React from "react";
import { Flame as FlameIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FlameProps {
  /** Streak days (real) — the glow intensity scales with min(days, 30). */
  days: number;
  /** At-risk = streak expires today. Supportive framing is the card's job, not loss-anxiety. */
  atRisk?: boolean;
  size?: number;
  className?: string;
}

/**
 * Streak flame (DecisionCard_System §6 · Pass 2). The flame is intrinsically WARM (gold), decoupled
 * from the card accent so the Streak card can be green (a learning behaviour) without a green flame.
 * The glow is **data-driven** — brighter with a longer streak (min days,30) — and uses a plain
 * rgba() (no color-mix → correct on old WebView). Static on low tier / reduced-motion.
 */
export function Flame({
  days,
  atRisk = false,
  size = 56,
  className,
}: FlameProps) {
  const intensity = 0.22 + 0.5 * (Math.min(Math.max(days, 0), 30) / 30);
  const flameColor = atRisk ? "#8a5a00" : "#b87a00";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(closest-side, rgba(237, 200, 37, ${intensity.toFixed(2)}), transparent 70%)`,
        }}
      />
      <FlameIcon
        className="relative"
        style={{ width: size * 0.55, height: size * 0.55, color: flameColor }}
        strokeWidth={2}
      />
      <span className="sr-only">{days}-day streak</span>
    </span>
  );
}
