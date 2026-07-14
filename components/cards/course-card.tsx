import * as React from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ProgressBar } from "../data/progress-bar";

export interface CourseCardProps {
  title: string;
  /** Media/thumbnail slot (real thumbnail); falls back to a branded gradient block. */
  media?: React.ReactNode;
  meta?: string;
  /** 0–100 for owned courses; omit for not-yet-owned. */
  progress?: number;
  owned?: boolean;
  /** CTA slot (Resume / Buy). One clear action. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Course card (Learning family, §10.2 · DESIGN §12 — cards are context-aware). Owned cards carry a
 * progress bar + "Resume"; unowned carry a price/Buy CTA. Obviously interactive (lift + focus).
 */
export function CourseCard({
  title,
  media,
  meta,
  progress,
  owned = false,
  action,
  className,
}: CourseCardProps) {
  return (
    <Card
      elevation="interactive"
      className={cn("dc-enter flex flex-col overflow-hidden p-0", className)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-green-600/15 to-green-500/5">
        {media ?? (
          <div className="flex h-full items-center justify-center text-theme-strong/40">
            <PlayCircle className="h-10 w-10" aria-hidden />
          </div>
        )}
        {owned && (
          <span className="absolute left-3 top-3">
            <Badge variant="brand">Owned</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-h4 font-bold text-ink">{title}</h3>
        {meta && <p className="mt-1 text-caption text-ink-muted">{meta}</p>}
        {typeof progress === "number" && (
          <div className="mt-3">
            <ProgressBar value={progress} showValue label="Progress" />
          </div>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
