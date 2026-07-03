"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
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
        <Card>
          <CardTitle>You&apos;re all set 🎉</CardTitle>
          <CardDescription>Start learning from your dashboard.</CardDescription>
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
