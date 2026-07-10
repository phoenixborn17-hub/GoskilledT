"use client";
// Add-lead form (Phase D · D3). MINIMAL. Owner-scoped via the server action; PII encrypted server-
// side. The client never logs the phone/email.
import { useState } from "react";
import { addAffiliateLead } from "../../app/dashboard/earn/my-leads/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AddLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOkMsg(false);
    const res = await addAffiliateLead({
      name: name.trim() || undefined,
      phone,
      email: email.trim() || undefined,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
    setOkMsg(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="lead-name">Name (optional)</Label>
          <Input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>
        <div>
          <Label htmlFor="lead-phone">Mobile number</Label>
          <Input
            id="lead-phone"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            maxLength={10}
            placeholder="10-digit mobile"
            required
          />
        </div>
        <div>
          <Label htmlFor="lead-email">Email (optional)</Label>
          <Input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="lead-note">Note (optional)</Label>
          <Input
            id="lead-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {okMsg && (
        <p role="status" className="text-sm font-medium text-brand">
          Lead saved ✓
        </p>
      )}
      <Button type="submit" variant="gold" disabled={busy || phone.length < 10}>
        {busy ? "Saving…" : "Add lead"}
      </Button>
    </form>
  );
}
