import * as React from "react";
import { cn } from "../../lib/utils";

export interface TopbarProps {
  /** Left slot — mobile menu button / breadcrumb / page title. */
  left?: React.ReactNode;
  title?: React.ReactNode;
  /** Right slot — Guru entry, notifications bell, profile menu (Amendments §G). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The 64px per-workspace top bar (Experience System §5). Sticky + glass so content scrolls
 * beneath it (glass auto-solidifies on low device-tier). Guru's top-bar entry lives in `actions`
 * on every workspace — no mobile FAB (Amendments §G).
 */
export function Topbar({ left, title, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 md:px-6",
        className,
      )}
    >
      {left}
      {title && (
        <h1 className="truncate font-heading text-h4 font-bold text-ink">
          {title}
        </h1>
      )}
      {actions && (
        <div className="ml-auto flex items-center gap-1.5">{actions}</div>
      )}
    </header>
  );
}
