"use client";
// Shown by dashboard/admin layouts when Supabase Auth couldn't be reached to verify the session
// (2026-07-15 login-bounce fix) — deliberately NOT a redirect to /login, since the user may well
// still be signed in. A plain retry reloads the page so the layout re-verifies from scratch.
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export function AuthUnavailableScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"
        aria-hidden
      >
        <RefreshCw className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-xl font-bold">
        Checking your session
      </h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t reach the login service just now — this is usually
        temporary and doesn&apos;t mean you&apos;ve been signed out.
      </p>
      <Button
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        Try again
      </Button>
    </main>
  );
}
