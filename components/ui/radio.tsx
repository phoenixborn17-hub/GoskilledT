import * as React from "react";
import { cn } from "../../lib/utils";

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
}

/** Radio backed by a real <input type=radio> — group them by sharing a `name`. */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
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
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border border-n-300 bg-surface-raised transition-colors [&>span]:scale-0",
              "peer-checked:border-theme peer-checked:[&>span]:scale-100",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-theme peer-focus-visible:ring-offset-2",
            )}
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full bg-theme transition-transform" />
          </span>
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Radio.displayName = "Radio";
