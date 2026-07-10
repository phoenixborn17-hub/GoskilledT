import * as React from "react";
import { Award } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

export interface CertificateCardProps {
  title: string;
  issuedOn?: string;
  /** Public verification serial (real). */
  serial?: string;
  /** Share/download slot (WhatsApp share is a referral lever, IA §5.2). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Certificate card (Learning family · DESIGN §14 verify trust). Pride surface — the medallion + a
 * real serial for verification. Share = referral lever. Real certificates only (D-29).
 */
export function CertificateCard({
  title,
  issuedOn,
  serial,
  action,
  className,
}: CertificateCardProps) {
  return (
    <Card
      elevation="raised"
      className={cn("relative overflow-hidden p-5", className)}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-400/15"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-400/20 text-warning-strong"
          aria-hidden
        >
          <Award className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-h4 font-bold text-ink">{title}</h3>
          {issuedOn && (
            <p className="mt-0.5 text-caption text-ink-muted">
              Issued {issuedOn}
            </p>
          )}
          {serial && (
            <p className="mt-1 font-mono text-caption text-ink-muted">
              Serial {serial}
            </p>
          )}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
