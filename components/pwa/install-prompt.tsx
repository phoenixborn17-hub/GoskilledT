"use client";
// GPS-M5 §2.5 — custom install prompt (Register 1). Shows AFTER the first lesson (eligible), never on
// landing. Premium dismissible banner; respects a one-time dismissal. Reduced-motion safe (CSS entrance
// is gated in globals.css via .enter). Only appears when the browser offers install (beforeinstallprompt).
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "gs-install-dismissed";

export function InstallPrompt({ eligible }: { eligible: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!eligible) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY))
      return;
    const onPrompt = (e: Event) => {
      e.preventDefault(); // suppress the mini-infobar; we show our own
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [eligible]);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    dismiss();
  }

  if (!show || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Install GoSkilled"
      className="enter fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand/20 bg-white p-4 shadow-lg md:bottom-6 md:left-64 md:right-6 md:mx-0"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
        aria-hidden
      >
        <Download className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-charcoal">Install GoSkilled</p>
        <p className="text-xs text-muted">
          Home screen par add karo — ek tap me wapas seekhna shuru.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="press shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-charcoal/5"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
