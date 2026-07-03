// Wallet summary (GPS-M3 §2.2). Held vs Available, DERIVED from the ledger (never computed in UI).
// Balances rendered as text (a11y), not colour-only.
import { formatINR } from "../../lib/money";
import type { WalletSummary as Summary } from "../../modules/wallet/summary";
import { Card } from "../ui/card";

export function WalletSummary({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="bg-gold/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Available now
        </p>
        <p className="font-heading text-2xl font-extrabold text-charcoal">
          {formatINR(summary.availableInPaise)}
        </p>
        <p className="mt-1 text-xs text-muted">Withdrawable (after KYC)</p>
      </Card>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Held (clearing)
        </p>
        <p className="font-heading text-2xl font-extrabold text-charcoal">
          {formatINR(summary.heldInPaise)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Unlocks after the 48-hour refund window
        </p>
      </Card>
    </div>
  );
}
