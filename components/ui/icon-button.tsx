import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "ghost" | "outline" | "solid";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  ghost: "text-ink-muted hover:bg-charcoal/5 hover:text-ink",
  outline: "border border-line text-ink hover:bg-charcoal/5",
  solid: "bg-theme text-theme-fg hover:opacity-90",
};

// Square, ≥44px touch target on md/lg (WCAG 2.5.5 / DESIGN §18). sm is for dense desktop toolbars.
const sizes: Record<Size, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-11 w-11 rounded-xl",
  lg: "h-12 w-12 rounded-xl",
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Required — icon-only controls MUST carry an accessible name (a11y). */
  "aria-label": string;
}

/** Icon-only button. `aria-label` is required by the type so it can never ship unlabelled. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, variant = "ghost", size = "md", type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "press inline-flex items-center justify-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
