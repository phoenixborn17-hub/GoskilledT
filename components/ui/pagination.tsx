"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconButton } from "./icon-button";

export interface PaginationProps {
  page: number; // 1-based
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Compact prev / "Page X of Y" / next control for DataTable and lists. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <IconButton
        aria-label="Previous page"
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </IconButton>
      <span
        className="text-small tabular-nums text-ink-muted"
        aria-live="polite"
      >
        Page <span className="font-semibold text-ink">{page}</span> of{" "}
        {pageCount}
      </span>
      <IconButton
        aria-label="Next page"
        size="sm"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </IconButton>
    </nav>
  );
}
