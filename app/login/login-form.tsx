"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/form-field";
import { Alert } from "../../components/ui/alert";
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
          <FormField
            label="Mobile number"
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
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" loading={busy}>
            Send OTP
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
          <FormField label="Enter OTP" id="otp" hint={`Sent to +91 ${phone}`}>
            <OtpInput
              id="otp"
              value={token}
              onChange={setToken}
              onComplete={submitOtp}
              disabled={busy}
              autoFocus
            />
          </FormField>
          {error && <Alert variant="error">{error}</Alert>}
          <Button
            type="button"
            onClick={() => submitOtp(token)}
            loading={busy}
            disabled={token.length < 4}
          >
            Verify &amp; log in
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
