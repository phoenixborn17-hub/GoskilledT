import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface NotificationCardProps {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  time: string;
  /** Unread rows get a subtle brand tint + a dot. */
  unread?: boolean;
  tone?: "brand" | "success" | "warning" | "info";
  href?: string;
  onClick?: () => void;
  className?: string;
}

const toneClass: Record<NonNullable<NotificationCardProps["tone"]>, string> = {
  brand: "bg-theme/10 text-theme-strong",
  success: "bg-success/10 text-success",
  warning: "bg-warning-strong/10 text-warning-strong",
  info: "bg-info/10 text-info",
};

/**
 * A single notification row (Home §2 · Experience System §11). Functional colour is always paired
 * with an icon + label (§9). Renders as a link or button so it deep-links into the right workspace.
 */
export function NotificationCard({
  icon: Icon,
  title,
  description,
  time,
  unread = false,
  tone = "brand",
  href,
  onClick,
  className,
}: NotificationCardProps) {
  const inner = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          toneClass[tone],
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-small font-semibold text-ink">{title}</p>
          <span className="shrink-0 text-caption text-ink-muted">{time}</span>
        </div>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-caption text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {unread && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-theme"
          aria-label="Unread"
        />
      )}
    </>
  );

  const classes = cn(
    "flex w-full items-start gap-3 rounded-gs p-3 text-left transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
    unread ? "bg-theme/5 hover:bg-theme/10" : "hover:bg-surface-sunken",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
