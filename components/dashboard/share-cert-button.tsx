"use client";
// GPS-M5 §2.7 — share a verified certificate. Web Share API where available (native sheet), else a
// WhatsApp deep-link (India's default channel). Compliant social proof — D-29: pride, never earnings.
import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareCertButton({
  serial,
  courseTitle,
  variant = "brand",
}: {
  serial: string;
  courseTitle: string;
  variant?: "brand" | "ghost";
}) {
  const [done, setDone] = useState(false);
  const text = `Maine "${courseTitle}" complete kiya — dekho mera GoSkilled certificate:`;

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/${serial}`
        : `/verify/${serial}`;
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: "GoSkilled certificate", text, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to WhatsApp */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  const base =
    "press inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold";
  const cls =
    variant === "ghost"
      ? `${base} border border-brand/30 text-brand hover:bg-brand/5`
      : `${base} bg-brand text-brand-fg`;

  return (
    <button type="button" onClick={share} className={cls}>
      {done ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {done ? "Shared" : "Share certificate"}
    </button>
  );
}
