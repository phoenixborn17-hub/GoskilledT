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
  /** Persist the dismissal in localStorage under this key — dismissed-and-STAYS-dismissed
   *  (Command_Center_Spec §2.1 ⑧: a banner that reappears every visit is furniture by day 3). */
  storageKey?: string;
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
  storageKey,
  className,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  // Persisted dismissal is read in an effect (not the initializer) so SSR + hydration match.
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      // Storage unavailable (private mode) → session-only dismissal still works.
    }
  }, [storageKey]);
  const dismiss = () => {
    setDismissed(true);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "1");
      } catch {
        // Best-effort persistence only.
      }
    }
  };
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
          onClick={dismiss}
          className="shrink-0 rounded p-0.5 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
