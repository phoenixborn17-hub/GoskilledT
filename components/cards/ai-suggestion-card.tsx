"use client";
import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface AISuggestionCardProps {
  title: React.ReactNode;
  /** The honest "why this" — must trace to a real trigger/state (D-29, no fabricated insight). */
  reason?: React.ReactNode;
  /** Act CTA slot (deep-links to the next best action). */
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Guru insight card (Insight family, §10.2 — info/violet accent). Rules over real state only:
 * "Continue Module 4" appears solely when a module is genuinely in progress (Dashboard §5). Carries
 * a "why this" and act/dismiss. Never an income claim (Guru income red-team).
 */
export function AISuggestionCard({
  title,
  reason,
  action,
  onDismiss,
  className,
}: AISuggestionCardProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div
      className={cn(
        "relative flex gap-3 rounded-gs border border-info/25 bg-info/5 p-4",
        className,
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/15 text-info"
        aria-hidden
      >
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="pr-6 text-small font-semibold text-ink">{title}</p>
        {reason && (
          <p className="mt-0.5 text-caption text-ink-muted">{reason}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss suggestion"
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="absolute right-2 top-2 rounded p-0.5 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
