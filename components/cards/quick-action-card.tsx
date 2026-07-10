import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Emphasise the single primary action in a group (§1 one-primary-per-group). */
  primary?: boolean;
  className?: string;
}

/**
 * Quick-action tile (Home/workspace §2/§3). Contextual, rules-driven, ≤4 per group. Exactly one
 * `primary` per group carries the brand fill; the rest are calm outlines (Action family, §10.2).
 */
export function QuickActionCard({
  icon: Icon,
  label,
  href,
  primary = false,
  className,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "lift flex flex-col items-center justify-center gap-2 rounded-gs border p-4 text-center text-small font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
        primary
          ? "border-transparent bg-theme text-theme-fg hover:opacity-90"
          : "border-line bg-surface-raised text-ink hover:border-theme/40",
        className,
      )}
    >
      <Icon className="h-6 w-6" aria-hidden />
      {label}
    </Link>
  );
}
