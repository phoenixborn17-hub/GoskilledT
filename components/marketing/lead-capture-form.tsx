"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardTitle, CardDescription } from "../ui/card";

export interface LeadFormResult {
  ok: boolean;
  error?: string;
}
export interface LeadFormValues {
  name: string;
  phone: string;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
  };
  packageInterest?: string;
}

export function LeadCaptureForm({
  action,
  requireName,
  submitLabel,
  successTitle,
  successBody,
  successCta,
}: {
  action: (v: LeadFormValues) => Promise<LeadFormResult>;
  requireName: boolean;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  successCta?: { href: string; label: string };
}) {
  const sp = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const utm = {
      source: sp.get("utm_source"),
      medium: sp.get("utm_medium"),
      campaign: sp.get("utm_campaign"),
    };
    const res = await action({
      name,
      phone,
      utm,
      packageInterest: sp.get("package") ?? undefined,
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Something went wrong");
  }

  if (done) {
    return (
      <Card>
        <CardTitle className="text-brand">{successTitle}</CardTitle>
        <CardDescription>{successBody}</CardDescription>
        {successCta && (
          <div className="mt-4 max-w-xs">
            <Link href={successCta.href}>
              <Button variant="outline">{successCta.label}</Button>
            </Link>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="lead-name">Name{!requireName && " (optional)"}</Label>
          <Input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={requireName}
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="lead-phone">Mobile number</Label>
          <Input
            id="lead-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={10}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Submitting…" : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
