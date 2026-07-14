"use client";
// Dashboard-segment error boundary. Catches errors thrown by pages/actions BELOW this segment's
// layout — the layout (AppShell chrome) has already rendered successfully by the time this can
// fire, so the sidebar/top bar stay in place and only the content area shows the retry state.
// (Errors thrown IN the layout itself, e.g. the auth check, are NOT caught here — see
// app/dashboard/layout.tsx for why and how those are handled.)
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"
        aria-hidden
      >
        <RefreshCw className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted">
        A hiccup loading this page — not you. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
      {error.digest && (
        <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>
      )}
    </div>
  );
}
