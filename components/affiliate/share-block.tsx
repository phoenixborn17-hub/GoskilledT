"use client";
// Referral share block (GPS-M3 §2.0/§2.1). One-tap share: Web Share API where available, wa.me
// fallback otherwise. Fires the canonical `referral_share` event via a server action. No ₹, no
// income language — invite only.
import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { recordReferralShare } from "../../app/dashboard/earn/actions";
import { AFFILIATE_COPY } from "../../lib/affiliate/copy";
import { Button } from "../ui/button";

export function ShareBlock({
  shareUrl,
  shareMessage,
}: {
  shareUrl: string;
  shareMessage: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link is visible for manual copy */
    }
  }

  async function onShare() {
    const text = `${shareMessage} ${shareUrl}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareMessage, url: shareUrl });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
      void recordReferralShare();
    } catch {
      /* user cancelled the share sheet — no-op */
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="ref-link" className="sr-only">
        Your referral link
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-3 py-2">
        <input
          id="ref-link"
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-charcoal outline-none"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Link copied" : "Copy referral link"}
          className="press inline-flex shrink-0 items-center gap-1 rounded-lg bg-charcoal/5 px-2.5 py-1.5 text-xs font-semibold text-charcoal hover:bg-charcoal/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />{" "}
              {AFFILIATE_COPY.copied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />{" "}
              {AFFILIATE_COPY.copyCta}
            </>
          )}
        </button>
      </div>
      <Button variant="gold" onClick={onShare}>
        <Share2 className="mr-2 h-4 w-4" aria-hidden />{" "}
        {AFFILIATE_COPY.shareCta}
      </Button>
    </div>
  );
}
