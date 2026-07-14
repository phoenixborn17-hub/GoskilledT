"use client";
// Registration form (Phase A — DR-036). Three steps: referral code (gate) → mobile+password(+name)
// → OTP. Invite-only: without a valid code the form stays blocked and the "contact for a code"
// state (§4.4) is shown. Uses the shared OtpInput so code entry matches login everywhere.
import { useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/ui/form-field";
import { Alert } from "../../components/ui/alert";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { OtpInput } from "../../components/ui/otp-input";
import type { ContactChannels } from "../../lib/config/contact";
import {
  validateReferralCode,
  sendRegisterOtp,
  verifyRegisterOtp,
} from "./actions";

type Step = "code" | "details" | "otp";

export function RegisterForm({
  initialCode,
  initialValid,
  initialSponsorFirstName,
  contact,
}: {
  initialCode: string;
  initialValid: boolean;
  initialSponsorFirstName: string | null;
  contact: ContactChannels;
}) {
  const [step, setStep] = useState<Step>(initialValid ? "details" : "code");
  const [code, setCode] = useState(initialCode);
  const [sponsor, setSponsor] = useState<string | null>(
    initialValid ? initialSponsorFirstName : null,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onValidateCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await validateReferralCode(code);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSponsor(res.sponsorFirstName);
    setStep("details");
  }

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendRegisterOtp({ phone, referralCode: code, password });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setToken("");
    setStep("otp");
  }

  async function submitOtp(otp: string) {
    setBusy(true);
    setError(null);
    const res = await verifyRegisterOtp({
      phone,
      token: otp,
      referralCode: code,
      password,
      name: name.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    window.location.assign(res.redirectTo);
  }

  return (
    <Card>
      {step === "code" && (
        <>
          <CardTitle>You&apos;re invited to GoSkilled</CardTitle>
          <CardDescription>
            GoSkilled is invite-only. Enter the referral code from whoever
            invited you to get started.
          </CardDescription>
          <form onSubmit={onValidateCode} className="mt-6 space-y-4">
            <FormField
              label="Referral code"
              id="ref"
              name="ref"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="e.g. GS1A2B3C4D"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              maxLength={24}
              required
            />
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" loading={busy} disabled={code.length < 3}>
              Continue
            </Button>
          </form>
          <NoCodeContact contact={contact} />
        </>
      )}

      {step === "details" && (
        <>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            {sponsor ? `Invited by ${sponsor}. ` : ""}You&apos;re part of the
            Founding Batch.
          </CardDescription>
          <form onSubmit={onSendOtp} className="mt-6 space-y-4">
            <FormField
              label="What should we call you? (optional)"
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
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
            <FormField
              label="Create a password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint="You'll use your mobile number and this password to log in."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {error && <Alert variant="error">{error}</Alert>}
            <Button
              type="submit"
              loading={busy}
              disabled={phone.length < 10 || password.length < 8}
            >
              Send OTP
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("code");
                setError(null);
              }}
            >
              Use a different code
            </Button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <CardTitle>Verify your number</CardTitle>
          <CardDescription>
            Enter the one-time code we sent to finish creating your account.
          </CardDescription>
          <div className="mt-6 space-y-4">
            <FormField
              label="Enter the OTP"
              id="otp"
              hint={`Sent to +91 ${phone}`}
            >
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
              Verify &amp; create account
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("details");
                setError(null);
              }}
            >
              Change details
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/** The invite-only "no referral code" help panel (§4.4). Channels are LAUNCH_CONFIG (Layer-2). */
function NoCodeContact({ contact }: { contact: ContactChannels }) {
  return (
    <div className="mt-6 rounded-xl border border-line/10 bg-brand/5 p-4">
      <p className="text-sm font-semibold text-ink">
        Don&apos;t have a code?
      </p>
      <p className="mt-1 text-sm text-muted">
        Ask whoever told you about GoSkilled for their referral code — or reach
        out and we&apos;ll help you get one.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Chat on WhatsApp
        </a>
        <a
          href={`mailto:${contact.email}?subject=${encodeURIComponent("GoSkilled referral code request")}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-deep hover:underline"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {contact.email}
        </a>
      </div>
    </div>
  );
}
