import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  /** Collapse to icon-only (desktop rail). Label stays for screen readers. */
  collapsed?: boolean;
  /** Optional trailing count (e.g. unread notifications). */
  badge?: React.ReactNode;
}

/**
 * A single sidebar nav row. Active row carries the workspace accent (`theme` token) + a left rail.
 * When collapsed, the label is visually hidden but kept for assistive tech.
 */
export function SidebarItem({
  icon: Icon,
  label,
  href,
  active = false,
  collapsed = false,
  badge,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-gs px-3 py-2.5 text-small font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
        active
          ? "bg-theme/10 text-theme-strong"
          : "text-ink-muted hover:bg-charcoal/5 hover:text-ink",
        collapsed && "justify-center",
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-theme"
          aria-hidden
        />
      )}
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className={cn("flex-1 truncate", collapsed && "sr-only")}>
        {label}
      </span>
      {badge != null && !collapsed && (
        <span className="ml-auto shrink-0">{badge}</span>
      )}
    </Link>
  );
}
