"use client";
import * as React from "react";
import { WifiOff } from "lucide-react";

/**
 * Weak-connection / offline banner (Experience System §12). Listens to the browser online/offline
 * events and shows a calm, non-blocking bar. Auto-hides when the connection returns. Purely
 * additive — content underneath stays usable (honest state, never a dead end).
 */
export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-strong/10 px-4 py-2 text-caption font-medium text-warning-strong"
    >
      <WifiOff className="h-4 w-4" aria-hidden />
      You&apos;re offline — showing your last saved data. We&apos;ll refresh
      when you&apos;re back.
    </div>
  );
}
