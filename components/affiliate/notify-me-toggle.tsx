"use client";
import * as React from "react";
import { BellRing } from "lucide-react";
import { Switch } from "../ui/switch";

/**
 * Notify-me toggle for the Withdraw truth-surface (Amendments §D). A client-side PREFERENCE (stored
 * locally) — GoSkilled notifies everyone through its existing channels when payouts open; this lets
 * a user opt in explicitly and confirms it. Honest: it never claims a payout is coming, only that
 * we'll message when the gate opens. (Server persistence is a tracked LAUNCH_CONFIG follow-up.)
 */
export function NotifyMeToggle() {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    try {
      setOn(localStorage.getItem("gs:notify-payouts") === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem("gs:notify-payouts", next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-gs border border-line bg-surface-raised px-4 py-3">
      <span className="inline-flex items-center gap-2 text-small text-ink">
        <BellRing className="h-4 w-4 text-ink-muted" aria-hidden />
        {on
          ? "We'll message you when payouts open"
          : "Notify me when payouts open"}
      </span>
      <Switch
        checked={on}
        onChange={(e) => toggle(e.target.checked)}
        aria-label="Notify me when payouts open"
      />
    </div>
  );
}
