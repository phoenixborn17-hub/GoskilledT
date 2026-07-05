"use client";
// GPS-M5 §2.4 (Tier-B) — email preference toggle. Optimistic + honest: "Email updates" on = subscribed
// (emailOptOut false). Turning it off suppresses ALL product emails (welcome + certificate-ready too).
import { useState, useTransition } from "react";
import { setEmailOptOutAction } from "../../app/dashboard/actions";

export function EmailPrefToggle({
  initialOptedOut,
}: {
  initialOptedOut: boolean;
}) {
  const [subscribed, setSubscribed] = useState(!initialOptedOut);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const nextSubscribed = !subscribed;
    setSubscribed(nextSubscribed); // optimistic
    startTransition(async () => {
      const res = await setEmailOptOutAction(!nextSubscribed);
      if (!res.ok) setSubscribed(!nextSubscribed); // revert on failure
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal">Email updates</p>
        <p className="text-sm text-muted">
          Welcome + certificate emails. Aap kabhi bhi band kar sakte ho.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={subscribed}
        aria-label="Email updates"
        disabled={pending}
        onClick={toggle}
        className={
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 " +
          (subscribed ? "bg-brand" : "bg-charcoal/20")
        }
      >
        <span
          className={
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
            (subscribed ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </button>
    </div>
  );
}
