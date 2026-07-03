import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary: "press bg-brand text-brand-fg hover:bg-brand/90 disabled:opacity-50",
  outline: "border border-brand/30 bg-transparent text-charcoal hover:bg-brand/5",
  ghost: "bg-transparent text-charcoal hover:bg-charcoal/5",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-base font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
