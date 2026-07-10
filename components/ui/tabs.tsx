"use client";
import * as React from "react";
import { cn } from "../../lib/utils";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  /** Controlled value (optional). */
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Accessible tabs (ARIA tablist/tab/tabpanel, arrow-key roving handled by the browser's default
 * focus + our roving tabIndex). Uncontrolled by default; pass value/onValueChange to control.
 * Renders the active panel from `items[].content` when provided.
 */
export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps) {
  const [internal, setInternal] = React.useState(
    defaultValue ?? items[0]?.value,
  );
  const active = value ?? internal;
  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => select(item.value)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-small font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
                isActive
                  ? "border-theme text-theme-strong"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) =>
        item.content !== undefined && item.value === active ? (
          <div key={item.value} role="tabpanel" className="pt-4">
            {item.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
