import * as React from "react";
import { cn } from "../../lib/utils";

// Elevation ramp (progressive depth). `raised` is the historical default → identical to the
// pre-Polish-2 card, so existing surfaces render pixel-for-pixel unchanged.
//  · flat        — border only, no shadow (dense lists, nested cards, admin tables)
//  · raised      — border + soft shadow (the standard content card)
//  · interactive — raised + hover-lift affordance (clickable cards; wrap a Link/button)
// `.lift` is defined in globals.css (reduced-motion-gated, transform/opacity only → 60fps, CLS 0).
type Elevation = "flat" | "raised" | "interactive";

const elevations: Record<Elevation, string> = {
  flat: "border-charcoal/10",
  raised: "border-charcoal/10 shadow-sm",
  interactive:
    "border-charcoal/10 shadow-sm lift hover:border-brand/30 focus-within:border-brand/30",
};

export function Card({
  className,
  elevation = "raised",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { elevation?: Elevation }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6",
        elevations[elevation],
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("font-heading text-xl font-bold text-charcoal", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted", className)} {...props} />;
}
