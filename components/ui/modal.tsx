"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconButton } from "./icon-button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer actions (buttons). */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Accessible centred dialog (Experience System §10): role=dialog + aria-modal, Escape + backdrop
 * to close, body-scroll lock while open, focus moved into the panel on open and restored on close.
 * Transform/opacity entrance is reduced-motion-gated (`.guru-sheet` reuse would fight the centring,
 * so a local fade+scale is used). Radix Dialog can replace this later without changing the API.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog for keyboard + screen-reader users.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
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
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-md rounded-gs-lg border border-line bg-surface-raised p-6 shadow-gs-lg outline-none",
          "motion-safe:animate-[enter-up_200ms_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
      >
        {title && (
          <h2
            id={titleId}
            className="pr-8 font-heading text-h3 font-bold text-ink"
          >
            {title}
          </h2>
        )}
        {description && (
          <p id={descId} className="mt-1 text-small text-ink-muted">
            {description}
          </p>
        )}
        <div className={cn(title || description ? "mt-4" : undefined)}>
          {children}
        </div>
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
        <IconButton
          aria-label="Close"
          size="sm"
          onClick={onClose}
          className="absolute right-3 top-3"
        >
          <X className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}
