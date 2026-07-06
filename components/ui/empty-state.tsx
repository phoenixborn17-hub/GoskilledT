import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  /** Brand-tinted illustration glyph (lucide). */
  icon?: LucideIcon;
  /** Warm, Hinglish-friendly headline. Never "No data" — say what to do next. */
  title: string;
  description?: string;
  /** ONE clear CTA (a <Button>, <Link>, etc.). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The one empty-state primitive (DESIGN_DIRECTION §15): illustration + one warm line + one CTA,
 * with a subtle entrance (`.enter`, reduced-motion-gated). A beautiful zero-state, never a dead end.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "enter flex flex-col items-center px-4 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"
          aria-hidden
        >
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
