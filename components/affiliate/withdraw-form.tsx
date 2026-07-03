"use client";
// Withdrawal request form (GPS-M3 §2.5). Client collects the amount; ALL rules are enforced
// server-side by validateWithdrawal (the domain rule). Errors shown inline; Tuesday-payout note.
import { useState } from "react";
import { requestWithdrawal } from "../../app/dashboard/earn/actions";
import { formatINR } from "../../lib/money";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function WithdrawForm({
  availableInPaise,
}: {
  availableInPaise: number;
}) {
  const [rupees, setRupees] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const amountInPaise = Math.round(Number(rupees) * 100);
    const res = await requestWithdrawal({ amountInPaise });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-brand">
        Withdrawal requested ✓ — we&apos;ll review it and pay out on the next
        Tuesday.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="wd-amount">Amount (₹)</Label>
        <Input
          id="wd-amount"
          type="number"
          inputMode="numeric"
          min={500}
          max={25000}
          step={1}
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          placeholder="500"
          aria-describedby="wd-help"
          required
        />
        <p id="wd-help" className="mt-1 text-xs text-muted">
          Available: {formatINR(availableInPaise)} · min ₹500 · max ₹25,000 ·
          paid out on Tuesdays.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" variant="gold" disabled={busy}>
        {busy ? "Requesting…" : "Request withdrawal"}
      </Button>
    </form>
  );
}
