import * as React from "react";
import { RotateCw } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SafeDisplay } from "../../lib/format";

export interface DataValueProps {
  /** Result of `safeMoney(...)` / `safeCount(...)` — the ONLY way a currency/count reaches the UI. */
  value: SafeDisplay;
  /** Retry the fetch when the value failed to load. */
  onRetry?: () => void;
  /** Extra classes for the value text (e.g. size/colour). */
  className?: string;
}

/**
 * The money-never-fail-to-zero atom (Frozen_Spec_Amendments §B). Every currency / earnings /
 * referral-count value in the product renders through this component. When the data failed to
 * load it shows an inline **"Couldn't load — Retry"**, NEVER ₹0 and NEVER blank. A real, loaded
 * zero (a genuine ₹0 balance) is `{ ok: true }` and renders normally — only absent/broken data
 * fails safe. This is the single enforcement point so the rule can't be forgotten per-surface.
 */
export function DataValue({ value, onRetry, className }: DataValueProps) {
  if (value.ok) {
    return <span className={cn("tabular-nums", className)}>{value.text}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-small font-medium text-ink-muted">
      <span>Couldn&apos;t load</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded font-semibold text-theme-strong underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      ) : null}
    </span>
  );
}
