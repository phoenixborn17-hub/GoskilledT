import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-charcoal/15 bg-white px-4 text-base text-charcoal",
      "placeholder:text-charcoal/40", // placeholder = decorative hint (visible <Label> present); stays lighter
      "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
