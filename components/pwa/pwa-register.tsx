"use client";
// GPS-M5 §2.5 — service-worker registration. Production only: a SW in dev fights Next HMR and can
// serve stale chunks. Registers after load so it never competes with first paint (LCP-safe).
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* best-effort — the app works fine without the SW */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
