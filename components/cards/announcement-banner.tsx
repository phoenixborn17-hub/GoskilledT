"use client";
import * as React from "react";
import { Megaphone, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface AnnouncementBannerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Inline action (a link/button). */
  action?: React.ReactNode;
  /** Allow the user to dismiss it (client-side for the session). */
  dismissible?: boolean;
  className?: string;
}

/**
 * Admin-managed announcement (Dashboard §2/§8). Real content only — a static real fallback when no
 * announcement is configured, never a fabricated one. Dismissible variant hides for the session.
 */
export function AnnouncementBanner({
  title,
  description,
  action,
  dismissible = false,
  className,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-gs border border-info/25 bg-info/5 p-4",
        className,
      )}
    >
      <span className="mt-0.5 text-info" aria-hidden>
        <Megaphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-0.5 text-caption text-ink-muted">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
