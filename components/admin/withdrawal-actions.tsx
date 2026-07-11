"use client";
// Per-row payout controls (GPS-M4 §2.3). Mark PAID is guarded by a confirm (real money already
// moved via bank); Reject needs a reason. The server re-checks KYC + recomputes the balance, so a
// stale row hard-stops instead of paying twice.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markPaidAction,
  markInProgressAction,
  rejectWithdrawalAction,
} from "../../app/admin/withdrawals/actions";

export function WithdrawalActions({
  withdrawalId,
  canMark,
  payoutsEnabled,
  status,
}: {
  withdrawalId: string;
  canMark: boolean;
  payoutsEnabled: boolean;
  status: "APPLIED" | "IN_PROGRESS" | "PAID" | "REJECTED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onStart() {
    setBusy(true);
    setError(null);
    const res = await markInProgressAction(withdrawalId);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function onMarkPaid() {
    // D-01: never invite an out-of-band bank transfer while payouts are OFF — the server
    // would reject the ledger move, leaving a real transfer with no record.
    if (!payoutsEnabled) return;
    if (
      !window.confirm(
        "Confirm you have ALREADY transferred this amount via bank. Mark PAID?",
      )
    )
      return;
    setBusy(true);
    setError(null);
    const res = await markPaidAction(withdrawalId);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function onReject() {
    setBusy(true);
    setError(null);
    const res = await rejectWithdrawalAction({ withdrawalId, reason });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "APPLIED" && (
          <button
            onClick={onStart}
            disabled={busy}
            className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-charcoal/5 disabled:opacity-40"
          >
            {busy ? "…" : "Start processing"}
          </button>
        )}
        <button
          onClick={onMarkPaid}
          disabled={busy || !canMark}
          title={
            !payoutsEnabled
              ? "Payouts are disabled (D-01) — no transfers"
              : canMark
                ? undefined
                : "KYC must be approved and balance sufficient"
          }
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40"
        >
          {busy ? "…" : "Mark PAID"}
        </button>
        <button
          onClick={() => setMode(mode === "rejecting" ? "idle" : "rejecting")}
          disabled={busy}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {mode === "rejecting" && (
        <div className="flex flex-col items-end gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Reason (required)"
            className="w-full rounded-lg border border-charcoal/20 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <button
            onClick={onReject}
            disabled={busy || !reason.trim()}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm reject
          </button>
        </div>
      )}
      {error && <p className="text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
