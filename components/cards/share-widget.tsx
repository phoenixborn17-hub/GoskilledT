"use client";
import * as React from "react";
import { Copy, Check, MessageCircle, QrCode } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

export interface ShareWidgetProps {
  /** The real referral link (never a placeholder). */
  link: string;
  /** Pre-filled Hinglish WhatsApp message built from real state (Dashboard §10 one-tap share). */
  whatsappMessage: string;
  /** Honest commission value copy, e.g. "₹150–₹250 per referral" (Amendments §D). */
  commissionValue?: string;
  /** Toggle a QR slot (Dashboard §9 — QR generated from the real link). */
  qrSlot?: React.ReactNode;
  className?: string;
}

/**
 * The persistent Share affordance (DR-039) — link · copy · WhatsApp · QR + honest commission value.
 * Copy is the most-polished micro-interaction (Amendments §H): the button morphs to "Copied ✓" then
 * nudges WhatsApp. Prefers `wa.me` deep-link over navigator.share (§10). All from real data (D-29).
 */
export function ShareWidget({
  link,
  whatsappMessage,
  commissionValue,
  qrSlot,
  className,
}: ShareWidgetProps) {
  const [copied, setCopied] = React.useState(false);
  const [showQr, setShowQr] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API unavailable (older Android WebView) — the visible link stays selectable.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-h4 font-semibold text-ink">
          Share &amp; grow
        </h3>
        {commissionValue && (
          <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-caption font-semibold text-warning-strong">
            {commissionValue}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-gs border border-line bg-surface-sunken px-3 py-2">
        <span
          className="min-w-0 flex-1 truncate text-small text-ink-muted"
          title={link}
        >
          {link}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-small font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme",
            copied
              ? "bg-success/10 text-success"
              : "text-theme-strong hover:bg-charcoal/5",
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copy
            </>
          )}
        </button>
      </div>

      {copied && (
        <p className="mt-2 text-caption font-medium text-success motion-safe:animate-[enter-up_200ms_ease]">
          Link copied — send it on WhatsApp 👇
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-base font-semibold text-ink transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-pressed={showQr}
          aria-label="Show QR code"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <QrCode className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {showQr && qrSlot && (
        <div className="mt-3 flex justify-center rounded-gs border border-line bg-surface-raised p-4">
          {qrSlot}
        </div>
      )}
    </Card>
  );
}
