"use client";
// Explicit PII reveal (GPS-M4 §2.2). Masked by default; a click fetches full details server-side
// (logged as KYC_VIEWED). Full values are held only in this client component's state, never in the
// page HTML until revealed.
import { useState } from "react";
import { revealKycAction } from "../../app/admin/kyc/actions";

interface Revealed {
  pan: string;
  accountNumber: string;
  holderName: string;
  ifsc: string | null;
}

export function KycReveal({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Revealed | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onReveal() {
    setBusy(true);
    setError(null);
    const res = await revealKycAction(userId);
    setBusy(false);
    if (res.ok) setData(res.data);
    else setError(res.error);
  }

  if (data) {
    return (
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">PAN</dt>
        <dd className="font-mono font-semibold">{data.pan}</dd>
        <dt className="text-muted">Account no.</dt>
        <dd className="font-mono font-semibold">{data.accountNumber}</dd>
        <dt className="text-muted">Account holder name</dt>
        <dd className="font-semibold">{data.holderName || "—"}</dd>
        <dt className="text-muted">IFSC</dt>
        <dd className="font-mono font-semibold">{data.ifsc ?? "—"}</dd>
      </dl>
    );
  }

  return (
    <div>
      <button
        onClick={onReveal}
        disabled={busy}
        className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-sm font-semibold text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
      >
        {busy ? "Revealing…" : "Reveal full details (logged)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
