"use client";
// Branded 500 (route error boundary). Client component (required by Next). We NEVER render the
// error message/stack to the user (no leak of internals) — just a friendly recovery path.
import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { SiteHeader } from "../components/marketing/site-header";
import { SiteFooter } from "../components/marketing/site-footer";
import { Button } from "../components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console/monitoring for ops — not to the user.
    console.error("[route-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-gs-lg bg-brand/10 text-brand"
          aria-hidden
        >
          <RefreshCw className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-2xl font-bold">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-muted">
          A hiccup on our end — not you. Please try again. If it keeps
          happening, we&apos;re here to help.
        </p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
