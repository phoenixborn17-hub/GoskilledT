import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { EmptyState, type EmptyStateProps } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";

export type WidgetState = "loading" | "ready" | "empty" | "error";

export interface WidgetContainerProps {
  title?: React.ReactNode;
  /** Optional trailing action (a link/menu) beside the title. */
  action?: React.ReactNode;
  /** The widget state machine — bakes loading/empty/error into every dashboard widget (§11/§12). */
  state?: WidgetState;
  /** Config for the empty state (only used when state==="empty"). */
  empty?: EmptyStateProps;
  /** Retry handler for the error state. */
  onRetry?: () => void;
  errorTitle?: string;
  errorDescription?: string;
  children?: React.ReactNode;
  className?: string;
  /** Card elevation (defaults to raised). */
  elevation?: React.ComponentProps<typeof Card>["elevation"];
}

/**
 * The standard dashboard-widget shell (Experience System §11 Widget Registry). Every data widget
 * wraps in this so the four honest states — loading (skeleton, never a spinner or ₹0 flatline),
 * ready, empty (why + one CTA), error (calm + retry) — are guaranteed by construction (D-29). The
 * money-never-fail rule is enforced at the value level via <DataValue>; this enforces it at the
 * widget level.
 */
export function WidgetContainer({
  title,
  action,
  state = "ready",
  empty,
  onRetry,
  errorTitle,
  errorDescription,
  children,
  className,
  elevation = "raised",
}: WidgetContainerProps) {
  return (
    <Card elevation={elevation} className={cn("p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && (
            <h3 className="font-heading text-h4 font-semibold text-ink">
              {title}
            </h3>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {state === "loading" && (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}
      {state === "error" && (
        <ErrorState
          title={errorTitle}
          description={errorDescription}
          onRetry={onRetry}
          className="py-8"
        />
      )}
      {state === "empty" && empty && <EmptyState {...empty} className="py-8" />}
      {state === "ready" && children}
    </Card>
  );
}
