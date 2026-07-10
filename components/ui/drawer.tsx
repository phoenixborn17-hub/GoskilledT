"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconButton } from "./icon-button";

type Side = "left" | "right" | "bottom";

const sideClasses: Record<Side, string> = {
  left: "inset-y-0 left-0 h-full w-[min(20rem,85vw)] rounded-r-gs-lg motion-safe:animate-[guru-slide-in_260ms_cubic-bezier(0.16,1,0.3,1)]",
  right:
    "inset-y-0 right-0 h-full w-[min(20rem,85vw)] rounded-l-gs-lg motion-safe:animate-[guru-slide-in_260ms_cubic-bezier(0.16,1,0.3,1)]",
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-gs-lg motion-safe:animate-[guru-slide-up_260ms_cubic-bezier(0.16,1,0.3,1)]",
};

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Slide-in panel — the mobile nav drawer (side="left") and bottom sheets (side="bottom"). Same
 * a11y contract as <Modal> (role=dialog, Escape, backdrop, scroll-lock, focus-in/restore).
 */
export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
  className,
}: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0 bg-charcoal/40 motion-safe:animate-[enter-up_200ms_ease]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute border-line bg-surface-raised p-5 shadow-gs-lg outline-none",
          sideClasses[side],
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          {title ? (
            <h2
              id={titleId}
              className="font-heading text-h4 font-bold text-ink"
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          <IconButton aria-label="Close" size="sm" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </IconButton>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
