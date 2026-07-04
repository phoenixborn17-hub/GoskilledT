"use client";
// Registration form (DR-030 §3). Two steps: phone (+ optional name) → segmented OTP. Uses the
// shared OtpInput so the code-entry experience matches login everywhere. No passwords, ever.
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { OtpInput } from "../../components/ui/otp-input";
import { sendRegisterOtp, verifyRegisterOtp } from "./actions";

export function RegisterForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendRegisterOtp({ phone });
    setBusy(false);
    if (res.ok) {
      setToken("");
      setStep("otp");
    } else setError(res.error);
  }

  async function submitOtp(code: string) {
    setBusy(true);
    setError(null);
    const res = await verifyRegisterOtp({
      phone,
      token: code,
      name: name.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    window.location.assign(res.redirectTo);
  }

  return (
    <Card>
      <CardTitle>Create your free account</CardTitle>
      <CardDescription>
        Just your mobile number — no passwords, ever. You&apos;re part of the
        Founding Batch.
      </CardDescription>

      {step === "phone" && (
        <form onSubmit={onSend} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">What should we call you? (optional)</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Create free account"}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="otp">Enter the OTP</Label>
            <OtpInput
              id="otp"
              value={token}
              onChange={setToken}
              onComplete={submitOtp}
              disabled={busy}
              autoFocus
            />
            <p className="mt-2 text-xs text-muted">Sent to +91 {phone}</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button
            type="button"
            onClick={() => submitOtp(token)}
            disabled={busy || token.length < 4}
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
          >
            Change number
          </Button>
        </div>
      )}
    </Card>
  );
}
