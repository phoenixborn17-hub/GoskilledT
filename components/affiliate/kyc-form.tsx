"use client";
// KYC form (Phase C §3, Tier A · PII). Collects contact (email/WhatsApp, each verified by code),
// bank details, PAN, an address-proof document type, and document uploads. The action Zod-validates,
// ENCRYPTS PAN/account/doc-paths server-side, and stores docs in a PRIVATE bucket. The client never
// stores or logs PII. Verification flags are set only via the verify sub-flow.
import { useState } from "react";
import {
  submitKyc,
  sendKycVerification,
  confirmKycVerification,
} from "../../app/dashboard/earn/actions";
import { KYC_DOC_TYPES } from "../../lib/kyc/doc-types";
import type { VerifyChannel } from "../../modules/kyc/verify";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export interface KycInitial {
  email: string | null;
  emailVerified: boolean;
  whatsapp: string | null;
  whatsappVerified: boolean;
}

export function KycForm({ initial }: { initial: KycInitial }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [emailOk, setEmailOk] = useState(initial.emailVerified);
  const [waOk, setWaOk] = useState(initial.whatsappVerified);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitKyc(fd);
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
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      encType="multipart/form-data"
    >
      {/* Contact — each channel verified with a one-time code */}
      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-bold">Contact</legend>
        <ContactVerify
          channel="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          initialValue={initial.email ?? ""}
          verified={emailOk}
          onVerified={() => setEmailOk(true)}
        />
        <ContactVerify
          channel="whatsapp"
          label="WhatsApp number"
          type="tel"
          placeholder="10-digit WhatsApp number"
          initialValue={initial.whatsapp?.replace("+91", "") ?? ""}
          verified={waOk}
          onVerified={() => setWaOk(true)}
        />
      </fieldset>

      {/* Bank */}
      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-bold">Bank account</legend>
        <Field
          id="kyc-holder"
          name="holderName"
          label="Account holder name"
          autoComplete="name"
          maxLength={80}
          required
        />
        <Field
          id="kyc-bank"
          name="bankName"
          label="Bank name"
          maxLength={80}
          required
        />
        <Field
          id="kyc-account"
          name="accountNumber"
          label="Account number"
          inputMode="numeric"
          maxLength={18}
          required
        />
        <Field
          id="kyc-ifsc"
          name="ifsc"
          label="IFSC"
          placeholder="SBIN0001234"
          maxLength={11}
          required
          uppercase
        />
      </fieldset>

      {/* Identity + documents */}
      <fieldset className="space-y-4">
        <legend className="font-heading text-sm font-bold">
          Identity &amp; documents
        </legend>
        <Field
          id="kyc-pan"
          name="pan"
          label="PAN"
          placeholder="ABCDE1234F"
          maxLength={10}
          required
          uppercase
        />
        <FileField
          id="kyc-pan-doc"
          name="panDoc"
          label="PAN card (image/PDF)"
        />
        <div>
          <Label htmlFor="kyc-doctype">Address proof — document type</Label>
          <select
            id="kyc-doctype"
            name="docType"
            required
            defaultValue=""
            className="h-11 w-full rounded-xl border border-charcoal/15 bg-white px-4 text-base"
          >
            <option value="" disabled>
              Choose…
            </option>
            {KYC_DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <FileField
          id="kyc-address-doc"
          name="addressDoc"
          label="Address proof (image/PDF)"
        />
        <FileField
          id="kyc-bank-doc"
          name="bankDoc"
          label="Bank proof — passbook/cheque (image/PDF)"
        />
      </fieldset>

      {!emailOk || !waOk ? (
        <p className="text-xs text-muted">
          Verify your email and WhatsApp above (each with a one-time code)
          before submitting — we need both to reach you about payouts.
        </p>
      ) : null}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" variant="gold" disabled={busy || !emailOk || !waOk}>
        {busy ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}

// ── Contact verify sub-flow: enter value → send code → enter code → verified. ──
function ContactVerify({
  channel,
  label,
  type,
  placeholder,
  initialValue,
  verified,
  onVerified,
}: {
  channel: VerifyChannel;
  label: string;
  type: string;
  placeholder: string;
  initialValue: string;
  verified: boolean;
  onVerified: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    const res = await sendKycVerification(channel, value);
    setBusy(false);
    if (res.ok) {
      setSent(true);
      setMsg("Code sent. Enter it below.");
    } else setMsg(res.error);
  }
  async function confirm() {
    setBusy(true);
    setMsg(null);
    const res = await confirmKycVerification(channel, value, code);
    setBusy(false);
    if (res.ok) onVerified();
    else setMsg(res.error);
  }

  return (
    <div>
      <Label htmlFor={`kyc-${channel}`}>
        {label}{" "}
        {verified && (
          <span className="text-xs font-semibold text-brand">✓ verified</span>
        )}
      </Label>
      <div className="flex gap-2">
        <Input
          id={`kyc-${channel}`}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={verified}
        />
        {!verified && (
          <button
            type="button"
            onClick={send}
            disabled={busy || value.trim().length < 3}
            className="shrink-0 rounded-xl border border-charcoal/20 px-3 text-sm font-semibold text-charcoal hover:bg-charcoal/5 disabled:opacity-40"
          >
            {sent ? "Resend" : "Send code"}
          </button>
        )}
      </div>
      {!verified && sent && (
        <div className="mt-2 flex gap-2">
          <Input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            maxLength={6}
          />
          <button
            type="button"
            onClick={confirm}
            disabled={busy || code.length < 4}
            className="shrink-0 rounded-xl bg-gold px-3 text-sm font-semibold text-charcoal disabled:opacity-40"
          >
            Verify
          </button>
        </div>
      )}
      {msg && <p className="mt-1 text-xs text-muted">{msg}</p>}
    </div>
  );
}

function Field({
  id,
  name,
  label,
  uppercase,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  uppercase?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [v, setV] = useState("");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        value={v}
        onChange={(e) =>
          setV(uppercase ? e.target.value.toUpperCase() : e.target.value)
        }
        {...rest}
      />
    </div>
  );
}

function FileField({
  id,
  name,
  label,
}: {
  id: string;
  name: string;
  label: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="block w-full text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal/5 file:px-3 file:py-2 file:text-sm file:font-semibold"
      />
    </div>
  );
}
