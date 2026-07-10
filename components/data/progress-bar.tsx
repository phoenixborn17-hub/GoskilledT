import * as React from "react";

export interface ProgressBarProps {
  /** 0–100. Clamped. */
  value: number;
  className?: string;
  label?: string;
  /** Show the % label above-right. */
  showValue?: boolean;
}

/** Horizontal progress bar on the workspace `theme` fill. Width transition is reduced-motion-gated. */
export function ProgressBar({
  value,
  className,
  label,
  showValue = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-caption font-medium text-ink-muted">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="tabular-nums text-ink">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-n-150"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-theme motion-safe:transition-[width] motion-safe:duration-slow motion-safe:ease-standard"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
