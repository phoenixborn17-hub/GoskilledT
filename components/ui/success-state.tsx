"use client";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Confetti } from "./confetti";

export interface SuccessStateProps {
  /** Celebration headline proportional to the achievement. */
  title: string;
  description?: string;
  /** Optional next-step CTA. */
  action?: React.ReactNode;
  /** Fire a one-shot confetti burst (reserve for earned moments — purchase, certificate, Lesson 0). */
  celebrate?: boolean;
  className?: string;
}

/**
 * Designed success moment (DESIGN_DIRECTION §15): a check that pops in (reduced-motion-gated) with
 * optional, earned confetti. Tone = celebration proportional to the achievement.
 */
export function SuccessState({
  title,
  description,
  action,
  celebrate = false,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-4 py-12 text-center",
        className,
      )}
      role="status"
    >
      {celebrate && <Confetti fire />}
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand motion-safe:animate-[gs-pop_360ms_cubic-bezier(0.16,1,0.3,1)_both]"
        aria-hidden
      >
        <CheckCircle2 className="h-9 w-9" />
      </div>
      {/* Scoped keyframe — self-contained so the primitive needs no globals.css change. */}
      <style>{`@keyframes gs-pop{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:none}}`}</style>
      <h2 className="font-heading text-xl font-bold text-charcoal">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
