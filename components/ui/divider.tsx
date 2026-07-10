import * as React from "react";
import { cn } from "../../lib/utils";

export interface DividerProps {
  /** Optional centred label ("or", "This month"). */
  children?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/** Hairline separator on the dark-aware `line` token. Vertical variant for inline groups. */
export function Divider({
  children,
  orientation = "horizontal",
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn("inline-block w-px self-stretch bg-line", className)}
      />
    );
  }
  if (children) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 text-caption font-medium uppercase tracking-wide text-ink-muted",
          className,
        )}
      >
        <span className="h-px flex-1 bg-line" />
        {children}
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  return (
    <hr
      className={cn("border-0 border-t border-line", className)}
      role="separator"
    />
  );
}
