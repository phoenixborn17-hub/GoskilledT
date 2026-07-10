import * as React from "react";
import { Wrench } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MaintenanceScreenProps {
  title?: string;
  description?: string;
  className?: string;
}

/** Full-surface maintenance state (Experience System §12) — calm, honest, no dead end. */
export function MaintenanceScreen({
  title = "We'll be right back",
  description = "GoSkilled is getting a quick upgrade. Please check back in a few minutes — your progress and earnings are safe.",
  className,
}: MaintenanceScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center px-4 text-center",
        className,
      )}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-theme/10 text-theme-strong"
        aria-hidden
      >
        <Wrench className="h-10 w-10" />
      </div>
      <h1 className="font-heading text-h2 font-bold text-ink">{title}</h1>
      <p className="mt-3 max-w-md text-body text-ink-muted">{description}</p>
    </div>
  );
}
