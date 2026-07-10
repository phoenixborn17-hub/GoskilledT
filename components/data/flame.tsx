import * as React from "react";
import { Flame as FlameIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FlameProps {
  /** Streak days (real). Drives the size hint only; the number is rendered by the card. */
  days: number;
  /** At-risk = streak expires today. Supportive framing (not loss-anxiety) is the card's job. */
  atRisk?: boolean;
  size?: number;
  className?: string;
}

/**
 * Streak flame (DecisionCard_System §6 — Streak family). A Lucide flame on the gold accent with a
 * soft glow that pulses ONLY on capable tier (`.dc-glow`, stripped on low tier / reduced-motion).
 * Warmer when at-risk, but framed supportively by the card copy, never as loss.
 */
export function Flame({
  days,
  atRisk = false,
  size = 56,
  className,
}: FlameProps) {
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
        className="dc-glow absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--card-accent) 40%, transparent), transparent 70%)",
        }}
      />
      <FlameIcon
        className={cn(
          "relative dc-accent-text",
          atRisk && "text-warning-strong",
        )}
        style={{ width: size * 0.55, height: size * 0.55 }}
        strokeWidth={2}
      />
      <span className="sr-only">{days}-day streak</span>
    </span>
  );
}
