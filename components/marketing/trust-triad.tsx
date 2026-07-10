import * as React from "react";
import { ShieldCheck, BadgeIndianRupee, Lock } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Trust triad (Amendments §G · DESIGN §14) — the three trust marks placed AT the decision element
 * (Buy / Pay), never in the footer: 48-hour refund · GST-inclusive price · secure payment. Uses the
 * design system (not stock badge PNGs). Real, honest claims only (D-29 — no income guarantees).
 */
export function TrustTriad({ className }: { className?: string }) {
  const marks = [
    { icon: ShieldCheck, label: "48-hour refund" },
    { icon: BadgeIndianRupee, label: "GST-inclusive price" },
    { icon: Lock, label: "Secure payment" },
  ];
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-caption font-medium text-ink-muted",
        className,
      )}
    >
      {marks.map((m) => (
        <li key={m.label} className="inline-flex items-center gap-1.5">
          <m.icon className="h-4 w-4 text-theme-strong" aria-hidden />
          {m.label}
        </li>
      ))}
    </ul>
  );
}
