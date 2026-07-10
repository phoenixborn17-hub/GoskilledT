import * as React from "react";
import { cn } from "../../lib/utils";

export interface TooltipProps {
  /** Short text shown on hover/focus. */
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Lightweight CSS-only tooltip (Experience System §10) — reveals on hover AND keyboard focus
 * (focus-within), so it is not mouse-only. For critical labels the trigger should still carry an
 * accessible name; the tooltip is progressive enhancement, never the only source of the label.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-charcoal px-2.5 py-1.5 text-caption font-medium text-white opacity-0 shadow-gs transition-opacity duration-fast",
          "group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
