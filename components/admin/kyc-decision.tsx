"use client";
// KYC decision control (GPS-M4 §2.2). Approve is one click; Reject requires a reason. On success
// the server revalidates and the row leaves the queue.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewKycAction } from "../../app/admin/kyc/actions";

export function KycDecision({ userId }: { userId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: "APPROVE" | "REJECT") {
    setBusy(true);
    setError(null);
    const res = await reviewKycAction({ userId, decision, reason });
    setBusy(false);
    if (res.ok) router.push("/admin/kyc");
    else setError(res.error);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => submit("APPROVE")}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => setMode(mode === "rejecting" ? "idle" : "rejecting")}
          disabled={busy}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reject…
        </button>
      </div>

      {mode === "rejecting" && (
        <div className="space-y-2">
          <label htmlFor="kyc-reason" className="text-sm font-medium text-charcoal">
            Rejection reason (shown to the learner)
          </label>
          <textarea
            id="kyc-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={300}
            className="w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            placeholder="e.g. PAN photo unreadable — please resubmit"
          />
          <button
            onClick={() => submit("REJECT")}
            disabled={busy || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Confirm rejection"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
