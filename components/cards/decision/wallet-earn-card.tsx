import * as React from "react";
import { Wallet } from "lucide-react";
import { DecisionCard, type CardSize } from "./decision-card";
import { DataValue } from "../../data/data-value";
import { AreaChart } from "../../data/area-chart";
import type { SafeDisplay } from "../../../lib/format";

export interface WalletEarnCardProps {
  /** All money is SafeDisplay (safeMoney) — static, charcoal, never ₹0 on failure (§B). */
  available: SafeDisplay;
  pending: SafeDisplay;
  /** Honest payout status — never a fake "Paid" (D-01). */
  payoutStatus: string;
  /** Real ledger points for the mini area-line (≥3 or omitted). */
  trend?: number[];
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Wallet/Earn (gold) — money is STATIC + charcoal (no count-up, Amendments §D), routed through
 * <DataValue> so a load failure shows Retry, never ₹0. Signature viz = tiny ledger area-line.
 * Available is the hero; Pending + honest payout status sit beneath. One CTA: View Wallet.
 */
export function WalletEarnCard({
  available,
  pending,
  payoutStatus,
  trend,
  aiLine,
  href,
  size = "primary",
  index,
  state,
  onRetry,
}: WalletEarnCardProps) {
  return (
    <DecisionCard
      icon={Wallet}
      label="Your earnings"
      accent="gold"
      size={size}
      aiLine={aiLine}
      cta="View Wallet"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="dc-number text-h1 font-bold text-ink">
            <DataValue value={available} onRetry={onRetry} raiseUnit />
          </div>
          <p className="mt-1 text-caption text-ink-muted">
            Pending{" "}
            <span className="font-semibold tabular-nums text-ink">
              <DataValue value={pending} onRetry={onRetry} />
            </span>
          </p>
        </div>
        {trend && trend.length >= 3 && (
          <div className="w-28 shrink-0">
            {/* De-twinned from Analytics: Wallet is a line-only "passbook rule" ledger. */}
            <AreaChart
              points={trend}
              width={112}
              height={56}
              fill={false}
              label="Earnings trend"
            />
          </div>
        )}
      </div>
      <p className="mt-3 inline-flex rounded-full bg-gold-400/10 px-2.5 py-1 text-caption font-medium text-warning-strong">
        {payoutStatus}
      </p>
    </DecisionCard>
  );
}
