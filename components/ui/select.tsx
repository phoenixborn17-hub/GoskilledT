import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Native <select> styled to the design system — zero-JS, keyboard/screen-reader correct out of the
 * box, and the right call on the Tier-2/3 mobile path (native pickers beat custom dropdowns). For
 * power-user comboboxes, a Radix-based Combobox can layer on later.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 pr-10 text-body text-ink",
        "focus-visible:border-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      aria-hidden
    />
  </div>
));
Select.displayName = "Select";
