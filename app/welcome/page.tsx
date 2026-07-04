// Welcome moment (DR-030 §4) — a one-time, full-screen, single-purpose screen shown right after
// registration. Auth-gated (its own guard; /welcome is outside the /dashboard matcher) and
// one-time (welcomeSeenAt short-circuits to the Hub). Honest "Founding Batch" framing (D-29).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/auth/session";
import { track } from "../../lib/analytics/track";
import { Badge } from "../../components/ui/badge";
import { WelcomeActions } from "./welcome-actions";

export const metadata: Metadata = {
  title: "Welcome to GoSkilled",
  robots: { index: false, follow: false }, // authenticated one-time moment — not for search
};

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/welcome");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, welcomeSeenAt: true },
  });
  // One-time: once completed or skipped, never show again.
  if (record?.welcomeSeenAt) redirect("/dashboard");

  await track("welcome_viewed", user.id, {});

  const name = record?.name?.trim() || null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      <div className="mx-auto mb-4">
        <Badge variant="gold">Founding Batch</Badge>
      </div>
      <h1 className="font-heading text-3xl font-extrabold text-charcoal">
        Welcome to GoSkilled, {name ?? "friend"} 👋
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">
        You&apos;re part of the Founding Batch. Let&apos;s start with a quick
        2-minute intro — then you&apos;re off.
      </p>

      <div className="mt-8">
        <WelcomeActions needsName={!name} />
      </div>
    </main>
  );
}
