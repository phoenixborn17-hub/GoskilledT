"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface PopoverProps {
  /** The trigger element (a button). Cloned to wire click + aria-expanded. */
  trigger: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

/**
 * Click-to-open floating panel anchored to a trigger (profile menu, filters, notifications).
 * Closes on outside-click and Escape. Positioned below the trigger; keep contents short.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  className,
}: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerNode = React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      trigger.props.onClick?.(e);
      setOpen((v) => !v);
    },
    "aria-expanded": open,
    "aria-haspopup": "menu",
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {triggerNode}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-[12rem] rounded-gs border border-line bg-surface-raised p-1.5 shadow-gs-lg",
            "motion-safe:animate-[enter-up_150ms_ease]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
