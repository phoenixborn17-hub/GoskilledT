"use client";
// Welcome-moment interactions (DR-030 §4): optional name, one primary CTA (Start Lesson 0) and a
// quiet secondary (Skip to dashboard). No carousel, no tour, no feature list.
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { completeWelcome } from "./actions";

export function WelcomeActions({ needsName }: { needsName: boolean }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<"start" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(intent: "start" | "skip") {
    setBusy(intent);
    setError(null);
    const res = await completeWelcome({
      intent,
      name: needsName && name.trim() ? name.trim() : undefined,
    });
    if (!res.ok) {
      setBusy(null);
      return setError(res.error);
    }
    window.location.assign(res.redirectTo);
  }

  return (
    <div className="space-y-5">
      {needsName && (
        <div className="text-left">
          <Label htmlFor="welcome-name">What should we call you?</Label>
          <Input
            id="welcome-name"
            type="text"
            autoComplete="given-name"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            disabled={busy !== null}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <Button onClick={() => go("start")} disabled={busy !== null}>
          {busy === "start" ? "Starting…" : "Start your first lesson (2 min)"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => go("skip")}
          disabled={busy !== null}
        >
          {busy === "skip" ? "…" : "Skip to dashboard"}
        </Button>
      </div>
    </div>
  );
}
