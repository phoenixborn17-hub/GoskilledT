import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail. The last crumb is the current page (no link, aria-current). */
export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-small text-ink-muted">
        {items.map((crumb, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={`${crumb.label}-${i}`}
              className="flex items-center gap-1.5"
            >
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="rounded transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(last && "font-semibold text-ink")}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
