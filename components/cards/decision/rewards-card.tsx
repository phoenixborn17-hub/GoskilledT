import * as React from "react";
import { Gift } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { MilestoneTrack } from "../../data/milestone-track";
import { TierBadge, type Tier } from "../../data/tier-badge";

export interface RewardsCardProps {
  tier: Tier;
  /** Real "X away" line, e.g. "1 referral away · Silver". */
  awayText: string;
  total: number;
  reached: number;
  labels?: string[];
  aiLine?: string | null;
  cta?: string;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Rewards (gold) — signature viz = milestone track + tier medallion. Learning-first recognition
 * language (DR-035), never earnings/team framing. One CTA: Invite / Claim.
 */
export function RewardsCard({
  tier,
  awayText,
  total,
  reached,
  labels,
  aiLine,
  cta = "Invite to advance",
  href,
  size = "primary",
  index,
  state,
  onRetry,
}: RewardsCardProps) {
  return (
    <DecisionCard
      icon={Gift}
      label="Rewards"
      accent="gold"
      size={size}
      aiLine={aiLine}
      cta={cta}
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-3">
        <TierBadge tier={tier} />
        <div className="min-w-0">
          <h3 className="font-heading text-h4 font-bold text-ink">
            {awayText}
          </h3>
          <p className="text-caption text-ink-muted">Current tier · {tier}</p>
        </div>
      </div>
      <div className="mt-4">
        <MilestoneTrack total={total} reached={reached} labels={labels} />
      </div>
    </DecisionCard>
  );
}
