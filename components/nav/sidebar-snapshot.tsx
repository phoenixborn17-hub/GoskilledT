import * as React from "react";

export interface WorkspaceSnapshot {
  /** The one-line real-state snapshot, e.g. "3 courses · 41%" · "₹4,250 recorded" · "2 friends". */
  primary: string;
  /** Quiet context under it, e.g. "your learning so far". */
  caption: string;
}

/**
 * Sidebar workspace snapshot (Command_Center_Spec §1.2 R2) — kills the triple-label redundancy:
 * instead of repeating the workspace name (already on the switcher AND the topbar), the sidebar
 * header carries a real, honest one-line snapshot of that workspace's state. Server-composed from
 * existing reads; honest zeros welcome; money only ever arrives here pre-formatted from safe data.
 */
export function SidebarSnapshot({ primary, caption }: WorkspaceSnapshot) {
  return (
    <div className="min-w-0">
      <p className="truncate font-heading text-small font-bold text-ink">
        {primary}
      </p>
      <p className="truncate text-caption text-ink-muted">{caption}</p>
    </div>
  );
}
