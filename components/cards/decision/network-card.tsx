import * as React from "react";
import { Users } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { NetworkNodes } from "../../data/network-nodes";
import { StatValue } from "../../data/stat-value";

export interface NetworkCardProps {
  activeL1: number;
  thisMonth: number;
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Network (info) — signature viz = mini network-nodes drawn from the REAL active-L1 count. Number
 * counts up (non-money, capable tier). One CTA: Invite.
 */
export function NetworkCard({
  activeL1,
  thisMonth,
  aiLine,
  href,
  size = "primary",
  index,
  state,
  onRetry,
}: NetworkCardProps) {
  return (
    <DecisionCard
      icon={Users}
      label="Your network"
      accent="info"
      size={size}
      aiLine={aiLine}
      cta="Invite friends"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="dc-number text-h1 font-bold text-ink">
            <StatValue value={activeL1} countUp />
          </div>
          <p className="mt-1 text-caption text-ink-muted">
            active ·{" "}
            <span className="font-semibold text-ink">+{thisMonth}</span> this
            month
          </p>
        </div>
        <div className="w-40 shrink-0">
          <NetworkNodes count={activeL1} newCount={thisMonth} height={84} />
        </div>
      </div>
    </DecisionCard>
  );
}
