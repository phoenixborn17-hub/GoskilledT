import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "outline" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand/90",
  outline:
    "border border-brand/30 bg-transparent text-charcoal hover:bg-brand/5",
  ghost: "bg-transparent text-charcoal hover:bg-charcoal/5",
  // Gold-forward affiliate CTA — charcoal text on a gold fill (Golden Rule 14: gold is never
  // text on light; here it's a fill with dark text → AA).
  gold: "bg-gold text-charcoal hover:bg-gold/90",
};

// `md` is the historical size (h-11 / text-base) → existing buttons are unchanged.
const sizes: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-4 text-base",
  lg: "h-12 rounded-xl px-5 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner, sets `aria-busy`, and disables the button to prevent double-submit. */
  loading?: boolean;
}

// Inline spinner — transform-only spin, motion-reduced users see a static ring (no motion, still
// communicates "busy" via the visible spinner glyph + aria-busy).
function Spinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 motion-safe:animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      // `loading` implies disabled so a slow action can't be double-submitted.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "press inline-flex w-full items-center justify-center gap-2 font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
