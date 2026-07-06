import * as React from "react";
import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

export interface LoadingStateProps {
  /** Show a wider "title" bar above the body lines. */
  title?: boolean;
  /** Number of body skeleton lines. */
  lines?: number;
  className?: string;
  /** Accessible label announced to screen readers while loading. */
  label?: string;
}

/**
 * Generic text-block loading template (DESIGN_DIRECTION §15): fixed-height skeletons that reserve
 * the final layout's space → zero CLS on hydrate. For bespoke layouts, compose <Skeleton> directly;
 * this covers the common "heading + paragraph lines" placeholder that most sections need.
 */
export function LoadingState({
  title = true,
  lines = 3,
  className,
  label = "Loading",
}: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      {title && <Skeleton className="h-7 w-2/5" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}
