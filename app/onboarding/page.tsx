"use client";
import { useState } from "react";
import Link from "next/link";
import { PartyPopper, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { Confetti } from "../../components/ui/confetti";
import { saveOnboarding, skipOnboarding } from "./actions";

const GOALS = [
  { value: "SKILL", label: "Learn a skill" },
  { value: "INCOME", label: "Earn income" },
  { value: "BOTH", label: "Both" },
] as const;

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState<(typeof GOALS)[number]["value"]>("BOTH");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveOnboarding({ name, email, goal });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  async function onSkip() {
    setBusy(true);
    setError(null);
    const res = await skipOnboarding();
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        {/* Purchase-success signature moment (§2.6): honest — the learner has paid + is set up.
            Confetti self-guards reduced-motion; the card enters via the gated .enter class. */}
        <Confetti fire />
        <Card className="enter text-center">
          <span
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"
            aria-hidden
          >
            <PartyPopper className="h-8 w-8" />
          </span>
          <CardTitle className="text-2xl">You&apos;re all set 🎉</CardTitle>
          <CardDescription>
            Welcome aboard! Aapka access ready hai — chalo pehla lesson shuru
            karte hain.
          </CardDescription>

          {/* What you unlocked — the activation moment (Dashboard §5). */}
          <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2 text-left">
            <span className="inline-flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 text-sm font-medium text-brand-deep">
              <Unlock className="h-4 w-4 shrink-0" aria-hidden />
              Your full course access is unlocked
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 text-sm font-medium text-brand-deep">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              Covered by our 48-hour refund
            </span>
          </div>

          <div className="mx-auto mt-6 max-w-xs">
            <Link href="/dashboard/learn">
              <Button>Start your first lesson</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Card>
        <CardTitle>Tell us about you</CardTitle>
        <CardDescription>
          Optional — helps us personalise your experience.
        </CardDescription>

        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="goal">Your goal</Label>
            <div
              id="goal"
              className="grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Your goal"
            >
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  role="radio"
                  aria-checked={goal === g.value}
                  onClick={() => setGoal(g.value)}
                  className={
                    "rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors " +
                    (goal === g.value
                      ? "border-brand bg-brand text-brand-fg"
                      : "border-charcoal/15 text-charcoal/80 hover:bg-brand/5")
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save & continue"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={busy}
          >
            Skip for now
          </Button>
        </form>
      </Card>
    </main>
  );
}
