import * as React from "react";
import { Award, Medal, Crown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

/** Recognition tiers (DR-034/035) — learning-first language, never earnings/team framing. */
export type Tier = "Contributor" | "Mentor" | "Community Champion";

const tierIcon: Record<Tier, LucideIcon> = {
  Contributor: Medal,
  Mentor: Award,
  "Community Champion": Crown,
};

export interface TierBadgeProps {
  tier: Tier;
  size?: number;
  className?: string;
}

/**
 * Tier medallion (DecisionCard_System §6 — Rewards family). Gold accent art per tier; the glyph is
 * decorative (gold-safe: fill, not text), the tier name is charcoal. Real tier only (D-29).
 */
export function TierBadge({ tier, size = 44, className }: TierBadgeProps) {
  const Icon = tierIcon[tier];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: "color-mix(in srgb, var(--card-accent) 18%, transparent)",
        color: "var(--card-accent)",
      }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2} />
    </span>
  );
}
