"use client";
// Login form (Phase A — DR-036). Primary: mobile + password. Two alternatives, both via OTP:
//   • "OTP instead" — passwordless sign-in.
//   • "Forgot password" — verify OTP, then set a new password (no email link; phone is identity).
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/form-field";
import { Alert } from "../../components/ui/alert";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { OtpInput } from "../../components/ui/otp-input";
import {
  sendLoginOtp,
  loginWithPassword,
  verifyLoginOtp,
  resetPasswordWithOtp,
} from "./actions";

type Mode = "password" | "otp" | "reset";

export function LoginForm() {
  const nextParam = useSearchParams().get("next") ?? undefined;
  const [mode, setMode] = useState<Mode>("password");
  const [otpSent, setOtpSent] = useState(false); // for otp/reset: has the code been sent?
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function go(next: Mode) {
    setMode(next);
    setOtpSent(false);
    setToken("");
    setPassword("");
    setError(null);
  }

  function done(
    res: { ok: true; redirectTo: string } | { ok: false; error: string },
  ) {
    if (res.ok) window.location.assign(res.redirectTo);
    else setError(res.error);
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await loginWithPassword({ phone, password, next: nextParam });
    setBusy(false);
    done(res);
  }

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendLoginOtp({ phone });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setToken("");
    setOtpSent(true);
  }

  async function onVerifyOtp(code: string) {
    setBusy(true);
    setError(null);
    const res = await verifyLoginOtp({ phone, token: code, next: nextParam });
    setBusy(false);
    done(res);
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await resetPasswordWithOtp({
      phone,
      token,
      password,
      next: nextParam,
    });
    setBusy(false);
    done(res);
  }

  const phoneField = (
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
  );

  return (
    <Card>
      {/* ── Primary: password sign-in ─────────────────────────────────────── */}
      {mode === "password" && (
        <>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Log in with your mobile number and password.
          </CardDescription>
          <form onSubmit={onPasswordLogin} className="mt-6 space-y-4">
            {phoneField}
            <FormField
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <Alert variant="error">{error}</Alert>}
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length < 10 || password.length < 1}
            >
              Log in
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => go("otp")}
                className="font-semibold text-brand hover:underline"
              >
                Sign in with OTP
              </button>
              <button
                type="button"
                onClick={() => go("reset")}
                className="font-semibold text-muted hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <p className="text-center text-sm text-muted">
              New here?{" "}
              <Link href="/register" className="font-semibold text-brand">
                Register with a code
              </Link>
            </p>
          </form>
        </>
      )}

      {/* ── Alternative: passwordless OTP sign-in ─────────────────────────── */}
      {mode === "otp" && (
        <>
          <CardTitle>Sign in with OTP</CardTitle>
          <CardDescription>
            We&apos;ll text a one-time code to your mobile number.
          </CardDescription>
          {!otpSent ? (
            <form onSubmit={onSendOtp} className="mt-6 space-y-4">
              {phoneField}
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" loading={busy} disabled={phone.length < 10}>
                Send OTP
              </Button>
              <BackToPassword onClick={() => go("password")} />
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <FormField
                label="Enter OTP"
                id="otp"
                hint={`Sent to +91 ${phone}`}
              >
                <OtpInput
                  id="otp"
                  value={token}
                  onChange={setToken}
                  onComplete={onVerifyOtp}
                  disabled={busy}
                  autoFocus
                />
              </FormField>
              {error && <Alert variant="error">{error}</Alert>}
              <Button
                type="button"
                onClick={() => onVerifyOtp(token)}
                loading={busy}
                disabled={token.length < 4}
              >
                Verify &amp; log in
              </Button>
              <BackToPassword onClick={() => go("password")} />
            </div>
          )}
        </>
      )}

      {/* ── Reset: verify OTP, then set a new password ────────────────────── */}
      {mode === "reset" && (
        <>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Verify your mobile number with an OTP, then set a new password.
          </CardDescription>
          {!otpSent ? (
            <form onSubmit={onSendOtp} className="mt-6 space-y-4">
              {phoneField}
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" loading={busy} disabled={phone.length < 10}>
                Send OTP
              </Button>
              <BackToPassword onClick={() => go("password")} />
            </form>
          ) : (
            <form onSubmit={onReset} className="mt-6 space-y-4">
              <FormField
                label="Enter OTP"
                id="otp"
                hint={`Sent to +91 ${phone}`}
              >
                <OtpInput
                  id="otp"
                  value={token}
                  onChange={setToken}
                  disabled={busy}
                  autoFocus
                />
              </FormField>
              <FormField
                label="New password"
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              {error && <Alert variant="error">{error}</Alert>}
              <Button
                type="submit"
                loading={busy}
                disabled={token.length < 4 || password.length < 8}
              >
                Set new password &amp; log in
              </Button>
              <BackToPassword onClick={() => go("password")} />
            </form>
          )}
        </>
      )}
    </Card>
  );
}

function BackToPassword({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onClick}>
      Back to password login
    </Button>
  );
}
