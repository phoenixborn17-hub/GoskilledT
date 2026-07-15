// Referral click → conversion stats (Feature Batch v1.0 §3). Counts only — no ₹ here (the
// commission amount itself already lives on Commissions/Wallet); still routed through
// safeCount/DataValue so a failed load never silently shows a fabricated zero.
import { safeCount } from "../../lib/format";
import { DataValue } from "../data/data-value";
import type { ReferralConversionStats } from "../../lib/affiliate/referral-click";

export function ConversionStats({ stats }: { stats: ReferralConversionStats }) {
  const rateText =
    stats.conversionRate === null
      ? "—"
      : `${Math.round(stats.conversionRate * 100)}%`;

  return (
    <div className="vh-card vh-soft vh-accent-network dc-enter grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
      <Stat label="Clicks" value={safeCount(stats.clicks)} />
      <Stat label="Signups" value={safeCount(stats.signups)} />
      <Stat label="Paid conversions" value={safeCount(stats.paidConversions)} />
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Conversion rate
        </p>
        <p className="dc-number mt-1 text-h3 font-bold text-ink">{rateText}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: ReturnType<typeof safeCount>;
}) {
  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="dc-number mt-1 text-h3 font-bold text-ink">
        <DataValue value={value} />
      </p>
    </div>
  );
}
