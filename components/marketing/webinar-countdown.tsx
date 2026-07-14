"use client";
// Webinar countdown — honest urgency toward a REAL scheduled session (target passed as an ISO
// string from the DB; never a fabricated deadline). Ticks client-side only; before mount it shows
// the human date (passed in) so there's no hydration mismatch and no CLS. When the time passes it
// switches to "Starting soon" rather than negative numbers.
import * as React from "react";

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function WebinarCountdown({ targetIso }: { targetIso: string }) {
  const target = React.useMemo(
    () => new Date(targetIso).getTime(),
    [targetIso],
  );
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pre-mount / SSR: render a stable placeholder row (no ticking) → no hydration mismatch.
  const p = now === null ? { d: 0, h: 0, m: 0, s: 0 } : parts(target - now);
  const passed = now !== null && target - now <= 0;

  if (passed) {
    return (
      <p className="inline-flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-deep">
        Starting soon — register to get the joining link
      </p>
    );
  }

  const units: [number, string][] = [
    [p.d, "days"],
    [p.h, "hrs"],
    [p.m, "min"],
    [p.s, "sec"],
  ];
  return (
    <div
      className="flex gap-2.5"
      role="timer"
      aria-label="Time until the next free webinar"
    >
      {units.map(([v, label]) => (
        <div
          key={label}
          className="flex min-w-[3.75rem] flex-col items-center rounded-xl border border-brand/15 bg-surface-raised px-3 py-2 shadow-gs-sm"
        >
          <span className="font-heading text-2xl font-extrabold tabular-nums text-ink">
            {String(v).padStart(2, "0")}
          </span>
          <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
