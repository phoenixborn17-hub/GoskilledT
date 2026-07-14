import * as React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * The always-visible honest payout-status line (Dashboard §4 · Amendments §D). Earnings are
 * recorded & safe in the ledger; payouts open only when the legal gate (D-01) does. Never a fake
 * "Paid" and never a promise — just the truthful state.
 */
export function PayoutStatusLine({ open }: { open: boolean }) {
  return (
    <p
      className="vh-accent-earn vh-text flex items-start gap-2 rounded-gs px-3 py-2.5 text-small font-medium"
      style={{ background: "var(--vh-tint)" }}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {open
        ? "Payouts are open — your available balance can be withdrawn."
        : "Your earnings are recorded & safe. Payouts open soon — we'll notify you the moment they do."}
    </p>
  );
}
