import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface BottomNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

export interface BottomNavProps {
  /** 4 items on the consumer path (Home · Learn · Earn · Share). Recomposes to Learning-only
   *  when Affiliate is hidden (DR-040) — the caller passes the visible set; no dead slots. */
  items: BottomNavItem[];
  className?: string;
}

/**
 * Mobile bottom bar (Experience System §5 · DR-039) — thumb-reachable, 56px + safe-area inset,
 * glass (solidifies on low tier). Desktop hides it (the sidebar takes over).
 */
export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "glass fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-caption font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme",
              item.active ? "text-theme-strong" : "text-ink-muted",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
