"use client";
// Profile edit form (GPS-M2 §2.5): name/email editable + goal radiogroup (same semantics as
// onboarding). Phone is auth identity and rendered read-only by the page. Server action is
// Zod-validated — the client is never trusted.
import { useState } from "react";
import { updateProfile } from "../../app/dashboard/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Goal = "SKILL" | "INCOME" | "BOTH";

const GOALS: { value: Goal; label: string }[] = [
  { value: "SKILL", label: "Learn a skill" },
  { value: "INCOME", label: "Earn income" },
  { value: "BOTH", label: "Both" },
];

export function ProfileForm({
  initialName,
  initialEmail,
  initialGoal,
}: {
  initialName: string;
  initialEmail: string;
  initialGoal: Goal;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await updateProfile({ name, email, goal });
    setBusy(false);
    if (res.ok) setSaved(true);
    else setError(res.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={80}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          autoComplete="email"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-ink">
          Your goal
        </legend>
        <div
          role="radiogroup"
          aria-label="Your goal"
          className="flex flex-wrap gap-2"
        >
          {GOALS.map((g) => {
            const selected = goal === g.value;
            return (
              <button
                key={g.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setGoal(g.value);
                  setSaved(false);
                }}
                className={
                  "rounded-xl border px-4 py-2 text-sm font-medium transition-colors " +
                  (selected
                    ? "border-brand bg-brand text-brand-fg"
                    : "border-line/15 text-ink-muted hover:bg-brand/5")
                }
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm font-medium text-brand">
          Saved ✓
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
