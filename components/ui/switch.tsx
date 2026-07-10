import * as React from "react";
import { cn } from "../../lib/utils";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
}

/**
 * Toggle switch backed by a checkbox input (so it submits + announces as on/off). Used for
 * notify-me toggles, settings prefs. The knob slides on :checked (transform-only → 60fps).
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex cursor-pointer items-center gap-3 text-body text-ink",
          props.disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="relative inline-flex">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              "h-6 w-11 rounded-full bg-n-300 transition-colors",
              "peer-checked:bg-theme",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-theme peer-focus-visible:ring-offset-2",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-gs-sm transition-transform",
              "peer-checked:translate-x-5",
            )}
            aria-hidden
          />
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Switch.displayName = "Switch";
