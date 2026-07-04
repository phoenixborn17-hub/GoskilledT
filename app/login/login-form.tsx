"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { OtpInput } from "../../components/ui/otp-input";
import { sendLoginOtp, verifyLoginOtp } from "./actions";

export function LoginForm() {
  const nextParam = useSearchParams().get("next");
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendLoginOtp({ phone });
    setBusy(false);
    if (res.ok) {
      setToken("");
      setStep("otp");
    } else setError(res.error);
  }

  async function submitOtp(code: string) {
    setBusy(true);
    setError(null);
    const res = await verifyLoginOtp({ phone, token: code });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (nextParam) window.location.assign(nextParam);
    else setStep("done");
  }

  return (
    <Card>
      <CardTitle>Welcome back</CardTitle>
      <CardDescription>Log in with your mobile number.</CardDescription>

      {step === "phone" && (
        <form onSubmit={onSend} className="mt-6 space-y-4">
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
            {busy ? "Sending…" : "Send OTP"}
          </Button>
          <p className="text-center text-sm text-muted">
            New here?{" "}
            <Link href="/register" className="font-semibold text-brand">
              Register free
            </Link>
          </p>
        </form>
      )}

      {step === "otp" && (
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP</Label>
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
            {busy ? "Verifying…" : "Verify & log in"}
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

      {step === "done" && (
        <p className="mt-6 text-sm font-medium text-brand">
          You&apos;re signed in ✓
        </p>
      )}
    </Card>
  );
}
