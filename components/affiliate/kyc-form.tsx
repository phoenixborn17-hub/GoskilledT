"use client";
// KYC form (GPS-M3 §2.4, Tier A · PII). Collects PAN + account + IFSC + holder name. The action
// Zod-validates and ENCRYPTS server-side; the client never stores or logs PII.
import { useState } from "react";
import { submitKyc } from "../../app/dashboard/earn/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function KycForm() {
  const [pan, setPan] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await submitKyc({ pan, accountNumber, ifsc, holderName });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-brand">
        Submitted for review ✓ — we&apos;ll verify your details shortly.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="kyc-holder">Account holder name</Label>
        <Input
          id="kyc-holder"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          autoComplete="name"
          maxLength={80}
          required
        />
      </div>
      <div>
        <Label htmlFor="kyc-pan">PAN</Label>
        <Input
          id="kyc-pan"
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase())}
          placeholder="ABCDE1234F"
          maxLength={10}
          aria-describedby="kyc-pan-help"
          required
        />
        <p id="kyc-pan-help" className="mt-1 text-xs text-muted">
          10 characters, e.g. ABCDE1234F.
        </p>
      </div>
      <div>
        <Label htmlFor="kyc-account">Bank account number</Label>
        <Input
          id="kyc-account"
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          maxLength={18}
          required
        />
      </div>
      <div>
        <Label htmlFor="kyc-ifsc">IFSC</Label>
        <Input
          id="kyc-ifsc"
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value.toUpperCase())}
          placeholder="SBIN0001234"
          maxLength={11}
          aria-describedby="kyc-ifsc-help"
          required
        />
        <p id="kyc-ifsc-help" className="mt-1 text-xs text-muted">
          11 characters, e.g. SBIN0001234.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" variant="gold" disabled={busy}>
        {busy ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
