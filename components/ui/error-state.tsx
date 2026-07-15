"use client";
import * as React from "react";
import { RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export interface ErrorStateProps {
  icon?: LucideIcon;
  /** Plain-language, calm — blame the system, never the user. */
  title?: string;
  description?: string;
  /** Retry affordance — renders a "Try again" button when provided. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Calm, plain-language error state with a retry path (DESIGN_DIRECTION §15) — no red walls. Mirrors
 * the branded route error boundary so failures feel consistent wherever they surface.
 */
export function ErrorState({
  icon: Icon = RefreshCw,
  title = "Something went wrong",
  description = "A hiccup on our end — not you. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-4 py-12 text-center",
        className,
      )}
    >
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-gs-lg bg-brand/10 text-brand"
        aria-hidden
      >
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && (
        <div className="mt-6 w-full max-w-xs">
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
