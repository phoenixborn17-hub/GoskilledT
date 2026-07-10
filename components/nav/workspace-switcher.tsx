import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

/** Each workspace carries its own theme token so the active pill shows its true accent. */
export type WorkspaceTheme = "neutral" | "learn" | "earn";

export interface Workspace {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  theme: WorkspaceTheme;
}

export interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeKey: string;
  collapsed?: boolean;
  className?: string;
}

// The active pill themes to the target workspace even before navigation, so the switch reads
// instantly (green Learn / gold Earn / neutral Home). data-theme drives the `theme` token.
const activeThemeClass: Record<WorkspaceTheme, string> = {
  neutral: "bg-charcoal/5 text-ink",
  learn: "bg-green-600/10 text-green-800",
  earn: "bg-gold-400/20 text-warning-strong",
};

/**
 * Workspace switcher (Experience System §10 · Amendments §A) — Home (neutral) · Learn (green) ·
 * Earn (gold). The active workspace is always unmistakable (the cardinal nav rule). Hidden
 * workspaces (DR-040) are simply omitted from `workspaces` — no dead slots.
 */
export function WorkspaceSwitcher({
  workspaces,
  activeKey,
  collapsed = false,
  className,
}: WorkspaceSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Workspaces"
      className={cn("flex flex-col gap-1", className)}
    >
      {workspaces.map((ws) => {
        const active = ws.key === activeKey;
        const Icon = ws.icon;
        return (
          <Link
            key={ws.key}
            href={ws.href}
            role="tab"
            aria-selected={active}
            title={collapsed ? ws.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-gs px-3 py-2.5 text-small font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
              active
                ? activeThemeClass[ws.theme]
                : "text-ink-muted hover:bg-charcoal/5 hover:text-ink",
              collapsed && "justify-center",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className={cn(collapsed && "sr-only")}>{ws.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
