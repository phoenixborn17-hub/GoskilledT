"use client";
// AFFILIATE_PAYOUTS_ENABLED flip ceremony (GPS-M4 §2.4 — Tier A). A flip is a ceremony: shows
// current state + the D-01 (LC #1) gate, requires the exact typed phrase, and records an audit row.
// Enabling is blocked until LC #1 is final; disabling (emergency) is always available. The env flag
// stays the money source of truth — this records the ceremony; runtime activation is a redeploy.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPayoutsFlagAction } from "../../app/admin/settings/actions";

const ENABLE_PHRASE = "ENABLE PAYOUTS";
const DISABLE_PHRASE = "DISABLE PAYOUTS";

export function PayoutFlagCeremony({
  enabled,
  lcOneFinal,
}: {
  enabled: boolean;
  lcOneFinal: boolean;
}) {
  const router = useRouter();
  const direction = enabled ? "DISABLE" : "ENABLE";
  const phrase = enabled ? DISABLE_PHRASE : ENABLE_PHRASE;
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Enabling requires LC #1 final; disabling is always allowed.
  const blocked = direction === "ENABLE" && !lcOneFinal;

  async function onConfirm() {
    setBusy(true);
    setMsg(null);
    const res = await setPayoutsFlagAction({
      direction,
      typedConfirmation: typed,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.note });
      setOpen(false);
      setTyped("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
            enabled ? "bg-brand text-brand-fg" : "bg-charcoal/10 text-charcoal"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </span>
        <span className="text-sm text-muted">
          Affiliate payouts · D-01 legal gate (LC #1){" "}
          {lcOneFinal ? "cleared" : "pending"}
        </span>
      </div>

      {blocked ? (
        <p className="text-sm text-muted">
          Enabling payouts is locked until D-01 legal clearance (LC #1) is
          final. This is intentional — it reads the launch-config discipline
          into runtime.
        </p>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            enabled
              ? "border border-red-300 text-red-700 hover:bg-red-50"
              : "bg-brand text-brand-fg hover:bg-brand/90"
          }`}
        >
          {enabled ? "Disable payouts (emergency)…" : "Enable payouts…"}
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-charcoal/15 bg-charcoal/5 p-3">
          <label htmlFor="flag-confirm" className="text-sm font-medium">
            Type <code className="font-bold">{phrase}</code> to confirm
          </label>
          <input
            id="flag-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={busy || typed.trim() !== phrase}
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Recording…" : "Confirm"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-brand-deep" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
