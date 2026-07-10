import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
}

/**
 * Checkbox backed by a real <input> (keyboard + form semantics preserved). The native box is
 * visually hidden and a token-styled box mirrors its state via peer-* — the ✓ shows on :checked.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2.5 text-body text-ink",
          props.disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="relative inline-flex">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border border-n-300 bg-surface-raised transition-colors [&>svg]:opacity-0",
              "peer-checked:border-theme peer-checked:bg-theme peer-checked:text-theme-fg peer-checked:[&>svg]:opacity-100",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-theme peer-focus-visible:ring-offset-2",
            )}
            aria-hidden
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
