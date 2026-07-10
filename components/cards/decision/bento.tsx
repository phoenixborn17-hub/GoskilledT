import * as React from "react";
import { cn } from "../../../lib/utils";
import type { CardSize } from "./decision-card";

/**
 * Bento grid (DecisionCard_System §3) — the eye must land somewhere first. 12-col feel on a 4-col
 * track: hero (2) · primary (1) · secondary (1) · wide (full). Stacks on mobile, hero first.
 */
export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

const spanClass: Record<CardSize, string> = {
  hero: "md:col-span-2 xl:col-span-2",
  primary: "md:col-span-1 xl:col-span-1",
  secondary: "md:col-span-1 xl:col-span-1",
  wide: "md:col-span-2 xl:col-span-4",
};

/** Places a card in the bento with the span matching its size. */
export function BentoItem({
  size,
  children,
  className,
}: {
  size: CardSize;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(spanClass[size], className)}>{children}</div>;
}
