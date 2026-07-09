"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card } from "../../components/ui/card";
import type { ContactChannels } from "../../lib/config/contact";
import {
  startCheckout,
  verifyCheckoutOtp,
  type VerifyCheckoutResult,
} from "./actions";

interface CourseOption {
  id: string;
  title: string;
  status: string;
}

// Invite-only (DR-036): a valid referral code is MANDATORY before pay. It's pre-filled from the
// affiliate's ?ref= link in the common path, so manual pre-pay inputs stay ≤3 (phone, OTP, + course
// for Skill Builder). Password is deferred to /onboarding to keep the Razorpay step stable (§4.2).
export function CheckoutForm({
  packageSlug,
  requiresCourseChoice,
  courses,
  referralCode,
  contact,
}: {
  packageSlug: "skill-builder" | "career-booster";
  requiresCourseChoice: boolean;
  courses: CourseOption[];
  referralCode: string | null;
  contact: ContactChannels;
}) {
  const selectable = courses.filter((c) => c.status === "PUBLISHED");
  const [step, setStep] = useState<"phone" | "otp" | "created">("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [refCode, setRefCode] = useState<string>(
    (referralCode ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
  );
  const [chosenCourseId, setChosenCourseId] = useState<string>(
    requiresCourseChoice ? (selectable[0]?.id ?? "") : "",
  );
  const [order, setOrder] = useState<Extract<
    VerifyCheckoutResult,
    { ok: true }
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const common = {
    packageSlug,
    chosenCourseId: requiresCourseChoice ? chosenCourseId : undefined,
    referralCode: refCode,
  };

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await startCheckout({ ...common, phone });
    setBusy(false);
    if (res.ok) setStep("otp");
    else setError(res.error);
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await verifyCheckoutOtp({ ...common, phone, token });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setOrder(res);
    setStep("created");
  }

  return (
    <Card>
      {step === "phone" && (
        <form onSubmit={onSend} className="space-y-4">
          {requiresCourseChoice && (
            <div>
              <Label htmlFor="course">Choose your course</Label>
              <select
                id="course"
                className="h-11 w-full rounded-xl border border-charcoal/15 bg-white px-4 text-base"
                value={chosenCourseId}
                onChange={(e) => setChosenCourseId(e.target.value)}
                required
              >
                {selectable.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="ref">Referral code</Label>
            <Input
              id="ref"
              name="ref"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="e.g. GS1A2B3C4D"
              value={refCode}
              onChange={(e) =>
                setRefCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              maxLength={24}
              required
            />
            <p className="mt-1 text-xs text-muted">
              GoSkilled is invite-only. No code?{" "}
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Ask us on WhatsApp
              </a>
            </p>
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
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || refCode.length < 3}>
            {busy ? "Sending…" : "Continue to pay"}
          </Button>
          <p className="text-center text-xs text-muted">
            We&apos;ll send a one-time code. No password needed.
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={onVerify} className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              maxLength={8}
              required
            />
            <p className="mt-1 text-xs text-muted">Sent to +91 {phone}</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Verifying…" : "Verify & pay"}
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
        </form>
      )}

      {step === "created" && order && (
        <div className="space-y-2">
          <p className="text-base font-semibold text-brand">Order created ✓</p>
          <p className="text-sm text-charcoal/70">
            Payment order:{" "}
            <code className="break-all">{order.paymentOrderId}</code>
          </p>
          {order.provider === "mock" && (
            <p className="rounded-lg bg-gold/15 p-3 text-xs text-charcoal/70">
              Dev mock mode — complete the flow by running the webhook
              simulator:
              <br />
              <code>
                tsx scripts/dev-simulate-webhook.ts {order.paymentOrderId}{" "}
                {order.amountInPaise}
              </code>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
