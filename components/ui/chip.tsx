import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected (filter active) state. */
  selected?: boolean;
  /** Renders a remove ✕ and calls this instead of toggling. */
  onRemove?: () => void;
}

/**
 * Interactive filter/selection chip (Experience System §10). Unlike <Badge> (static status),
 * a Chip is a button: used for filters (all/learning/earning), pickers, and removable tags.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      selected = false,
      onRemove,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={onRemove ? undefined : selected}
      className={cn(
        "press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-small font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
        selected
          ? "border-theme bg-theme/10 text-theme-strong"
          : "border-line text-ink-muted hover:bg-charcoal/5 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 rounded-full p-0.5 hover:bg-charcoal/10"
        >
          <X className="h-3 w-3" aria-hidden />
        </span>
      )}
    </button>
  ),
);
Chip.displayName = "Chip";
