import * as React from "react";
import { cn } from "../../lib/utils";

export interface HeroBannerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary CTA slot (one action). */
  action?: React.ReactNode;
  /** Right-side illustration/media slot (optional). */
  media?: React.ReactNode;
  /** Workspace tone for the gradient wash. */
  tone?: "learn" | "earn" | "neutral";
  className?: string;
}

// Subtle, device-tier-safe gradient washes (static — no animation on the critical path). Gold wash
// stays a light tint (gold is never a text bg here; text sits on the light area, charcoal).
const toneWash: Record<NonNullable<HeroBannerProps["tone"]>, string> = {
  learn: "from-green-600/10 to-green-500/5",
  earn: "from-gold-400/20 to-gold-300/5",
  neutral: "from-charcoal/5 to-transparent",
};

/**
 * Dashboard hero banner (Dashboard §3/§4). Renders admin-CMS content when available, otherwise a
 * real static promo — NEVER a fabricated banner (Dashboard §8 fallback rule). One primary action.
 */
export function HeroBanner({
  title,
  description,
  action,
  media,
  tone = "learn",
  className,
}: HeroBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-gs-lg border border-line bg-gradient-to-br p-6 md:p-8",
        toneWash[tone],
        className,
      )}
    >
      <div className="flex items-center gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-h2 font-bold text-ink">{title}</h2>
          {description && (
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {description}
            </p>
          )}
          {action && <div className="mt-5">{action}</div>}
        </div>
        {media && <div className="hidden shrink-0 sm:block">{media}</div>}
      </div>
    </div>
  );
}
