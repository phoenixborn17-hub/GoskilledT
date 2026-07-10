import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { DataValue } from "../data/data-value";
import type { SafeDisplay } from "../../lib/format";

export interface WalletCardProps {
  /** All figures are SafeDisplay (safeMoney) — on failure each shows Retry, never ₹0 (§B / §D). */
  available: SafeDisplay;
  held: SafeDisplay;
  total: SafeDisplay;
  /** Honest, always-visible payout status ("Earnings recorded & safe; payouts open [status]"). */
  statusLine: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Wallet summary (Financial family, §10.2 · Amendments §D). Gold accent ONLY; figures are charcoal
 * tabular. "Available" is the anchor; "Held" carries 48h buyer-protection trust framing; a truthful
 * payout-status line is always visible (payouts OFF, D-01 — never a fake "Paid"). No count-up.
 */
export function WalletCard({
  available,
  held,
  total,
  statusLine,
  onRetry,
  className,
}: WalletCardProps) {
  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="mb-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
        Available balance
      </div>
      <div className="font-heading text-h1 font-bold tabular-nums text-ink">
        <DataValue value={available} onRetry={onRetry} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-gs bg-surface-sunken p-3">
          <div className="flex items-center gap-1.5 text-caption font-medium text-ink-muted">
            <ShieldCheck
              className="h-3.5 w-3.5 text-warning-strong"
              aria-hidden
            />
            Held (48h)
          </div>
          <div className="mt-1 font-semibold tabular-nums text-ink">
            <DataValue value={held} onRetry={onRetry} />
          </div>
        </div>
        <div className="rounded-gs bg-surface-sunken p-3">
          <div className="text-caption font-medium text-ink-muted">
            Total earned
          </div>
          <div className="mt-1 font-semibold tabular-nums text-ink">
            <DataValue value={total} onRetry={onRetry} />
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-gs bg-gold-400/10 px-3 py-2 text-caption font-medium text-warning-strong">
        {statusLine}
      </p>
    </Card>
  );
}
