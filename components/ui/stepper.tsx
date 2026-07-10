import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  /** 0-based index of the current step; earlier steps render as complete. */
  current: number;
  className?: string;
}

/**
 * Horizontal step indicator (KYC "get payout-ready", getting-started, checkout). Completed steps
 * show a ✓ on a brand fill; the current step is ringed; upcoming steps are muted. Presentational
 * (an <ol> for semantics) — the parent owns navigation.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-start", className)}>
      {steps.map((step, i) => {
        const complete = i < current;
        const active = i === current;
        return (
          <li
            key={step.label}
            className="flex flex-1 items-start last:flex-none"
            aria-current={active ? "step" : undefined}
          >
            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-small font-bold transition-colors",
                  complete && "border-theme bg-theme text-theme-fg",
                  active && "border-theme text-theme-strong",
                  !complete && !active && "border-n-300 text-ink-muted",
                )}
              >
                {complete ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-[8rem] text-caption font-semibold",
                  active || complete ? "text-ink" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 max-w-[8rem] text-caption text-ink-muted">
                  {step.description}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-4 h-0.5 flex-1",
                  i < current ? "bg-theme" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
