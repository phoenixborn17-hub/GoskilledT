import * as React from "react";
import { cn } from "../../lib/utils";

export interface SidebarSectionProps {
  /** Optional group heading (hidden when collapsed). */
  heading?: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

export function SidebarSection({
  heading,
  collapsed,
  children,
}: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {heading && !collapsed && (
        <p className="px-3 pb-1 pt-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
          {heading}
        </p>
      )}
      {children}
    </div>
  );
}

export interface SidebarProps {
  /** Brand/logo slot (top). */
  header?: React.ReactNode;
  /** Nav sections (SidebarSection + SidebarItem). */
  children: React.ReactNode;
  /** Persistent footer (the always-present Share affordance, DR-039). */
  footer?: React.ReactNode;
  collapsed?: boolean;
  className?: string;
}

/**
 * The desktop left sidebar shell (Experience System §5 · DR-039): 264px, collapses to a 72px rail.
 * Workspace theming comes from the ancestor `[data-theme]` — the sidebar itself is neutral chrome;
 * only the active item + Share pick up the accent. Presentational: U2 wires routes + active state.
 */
export function Sidebar({
  header,
  children,
  footer,
  collapsed = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-line bg-surface-raised transition-[width] duration-base",
        collapsed ? "w-[72px]" : "w-[264px]",
        className,
      )}
    >
      {header && (
        <div
          className={cn(
            "flex h-16 items-center border-b border-line px-4",
            collapsed && "justify-center px-0",
          )}
        >
          {header}
        </div>
      )}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{children}</nav>
      {footer && <div className="border-t border-line p-3">{footer}</div>}
    </aside>
  );
}
