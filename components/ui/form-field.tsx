import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { Label } from "./label";
import { Input } from "./input";

export interface FormFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "children"
> {
  label: React.ReactNode;
  /** Helper text shown under the field (hidden while an error is showing). */
  hint?: React.ReactNode;
  /** Inline validation message — renders a calm danger line + wires aria-invalid. */
  error?: string | null;
  /** Shows a success tick inside the field (e.g. after async validation passes). */
  success?: boolean;
  /** Wrapper className (the field group), not the input. */
  containerClassName?: string;
  /** Custom control (e.g. OtpInput) rendered in place of the default <Input>. */
  children?: React.ReactNode;
}

/**
 * Labelled field wrapper — the single form primitive: Label + control + hint/error + success tick,
 * with correct `htmlFor`/`aria-describedby`/`aria-invalid` wiring for screen readers. Pass input
 * props through directly, or supply a custom control via `children`.
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      hint,
      error,
      success = false,
      required,
      containerClassName,
      className,
      id: idProp,
      children,
      ...inputProps
    },
    ref,
  ) => {
    const reactId = React.useId();
    const id = idProp ?? reactId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      // No vertical spacing utility here: <Label> already carries mb-1.5, and hint/error add their
      // own mt — so an idle field (label + control) renders identically to hand-written markup.
      <div className={containerClassName}>
        <Label htmlFor={id}>
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
        </Label>

        {children ? (
          children
        ) : (
          <div className="relative">
            <Input
              ref={ref}
              id={id}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={cn(
                error &&
                  "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
                success && "pr-10",
                className,
              )}
              {...inputProps}
            />
            {success && !error && (
              <Check
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand"
                aria-hidden
              />
            )}
          </div>
        )}

        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
FormField.displayName = "FormField";
