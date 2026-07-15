import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "brand" | "muted" | "gold" | "outline";

// Gold rule (Golden Rule 14): gold is a FILL with charcoal text — never gold text on light.
const variants: Record<Variant, string> = {
  brand: "bg-brand/10 text-brand-deep",
  muted: "bg-charcoal/5 text-muted",
  gold: "bg-gold text-ink",
  outline: "border border-line/15 text-ink-muted",
};

export function Badge({
  className,
  variant = "brand",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
