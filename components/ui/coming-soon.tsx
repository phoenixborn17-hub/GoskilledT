import * as React from "react";
import { Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";

export interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Honest placeholder for RESERVED / not-yet-built features (Experience System §12; Dashboard §9
 * data-reality rule). This is the ONLY truthful way to represent a parked feature — never a
 * fabricated widget, never fake data (D-29). Clearly labelled "Coming soon".
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-gs border border-dashed border-line bg-surface-sunken px-4 py-10 text-center",
        className,
      )}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-theme/10 text-theme-strong"
        aria-hidden
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-h4 font-bold text-ink">{title}</h2>
        <Badge variant="muted">Coming soon</Badge>
      </div>
      {description && (
        <p className="mt-2 max-w-sm text-small text-ink-muted">{description}</p>
      )}
    </div>
  );
}
