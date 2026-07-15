"use client";
// Admin-segment error boundary. See app/dashboard/error.tsx for the same rationale — this only
// catches errors from pages/actions below app/admin/layout.tsx, not the layout's own auth check.
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-20 text-center">
      <div
        className="dc-enter mb-5 flex h-16 w-16 items-center justify-center rounded-gs-lg bg-charcoal/10 text-ink"
        aria-hidden
      >
        <RefreshCw className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-xl font-bold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted">
        This admin page hit an error. Try again — the rest of the console is
        unaffected.
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
