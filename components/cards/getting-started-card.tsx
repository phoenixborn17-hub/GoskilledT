import * as React from "react";
import { Check, Circle, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

export interface GettingStartedStep {
  title: string;
  description?: string;
  done?: boolean;
  /** The action for the current step (rendered on the first not-done step). */
  action?: React.ReactNode;
}

export interface GettingStartedCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  steps: GettingStartedStep[];
  className?: string;
}

/**
 * The honest zero-data getting-started (Dashboard §7 · Experience System §12). This IS the empty
 * layout for new users — never empty widgets or fake numbers (D-29). Renders a 3-step checklist
 * from real lifecycle state; the CTA sits on the first incomplete step (one primary action, §1).
 */
export function GettingStartedCard({
  title = "Let's get you started",
  subtitle,
  icon: Icon,
  steps,
  className,
}: GettingStartedCardProps) {
  const firstOpen = steps.findIndex((s) => !s.done);
  return (
    <Card elevation="raised" className={cn("overflow-hidden p-0", className)}>
      <div className="border-b border-line bg-theme/5 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme/15 text-theme-strong"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h3 className="font-heading text-h4 font-bold text-ink">{title}</h3>
            {subtitle && (
              <p className="text-caption text-ink-muted">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <ol className="divide-y divide-line">
        {steps.map((step, i) => {
          const active = i === firstOpen;
          return (
            <li key={step.title} className="flex gap-3 px-5 py-4">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  step.done
                    ? "bg-theme text-theme-fg"
                    : active
                      ? "border-2 border-theme text-theme-strong"
                      : "border border-n-300 text-ink-muted",
                )}
                aria-hidden
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-small font-semibold",
                    step.done ? "text-ink-muted line-through" : "text-ink",
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-caption text-ink-muted">
                    {step.description}
                  </p>
                )}
                {active && step.action && (
                  <div className="mt-3">{step.action}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
