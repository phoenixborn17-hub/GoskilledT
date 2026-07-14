// Wallet summary (GPS-M3 §2.2; Vibrant rollout Slice C — vh-recipe). Held vs Available, DERIVED
// from the ledger (never computed in UI). Money is STATIC (<DataValue>/safeMoney, never <CountUp>).
// Gold-vault focal for Available (the number that matters); Held on the cyan "clearing status"
// accent — a temporal state, not the earn family, so the two money cards never clash side by side.
import { safeMoney } from "../../lib/format";
import type { WalletSummary as Summary } from "../../modules/wallet/summary";
import { VibrantMetricCard } from "../cards/decision/vibrant-metric-card";
import { DataValue } from "../data/data-value";
import { Wallet, CalendarClock } from "lucide-react";

export function WalletSummary({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <VibrantMetricCard
        bold
        icon={Wallet}
        label="Available now"
        accent="vh-accent-earn"
        href="/dashboard/earn/wallet"
        numClassName="vh-gold-num"
        value={
          <DataValue value={safeMoney(summary.availableInPaise)} raiseUnit />
        }
        caption="Withdrawable (after KYC)."
      />
      <VibrantMetricCard
        icon={CalendarClock}
        label="Held (clearing)"
        accent="vh-accent-cyan"
        index={1}
        href="/dashboard/earn/wallet"
        value={<DataValue value={safeMoney(summary.heldInPaise)} raiseUnit />}
        caption="Unlocks after the 48-hour refund window."
      />
    </div>
  );
}
