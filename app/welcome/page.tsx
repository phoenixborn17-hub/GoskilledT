// Welcome moment (DR-030 §4) — a one-time, full-screen, single-purpose screen shown right after
// registration. Auth-gated (its own guard; /welcome is outside the /dashboard matcher) and
// one-time (welcomeSeenAt short-circuits to the Hub). Honest "Founding Batch" framing (D-29).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HeartHandshake } from "lucide-react";
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
  // One-time: once completed or skipped, never show again → the Home hub (DR-039). New accounts
  // (welcomeSeenAt null) fall through and see the welcome moment, preserving welcome → Lesson 0.
  if (record?.welcomeSeenAt) redirect("/dashboard/home");

  await track("welcome_viewed", user.id, {});

  const name = record?.name?.trim() || null;

  return (
    <main className="welcome-glow mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      {/* Belonging emblem — a warm membership medallion with a soft gold halo (charcoal icon: gold
          stays a fill, never text on light). Gentle staged entrance; static under reduced-motion. */}
      <div className="enter mx-auto mb-5">
        <span
          className="welcome-medallion relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-gold/25 text-ink"
          aria-hidden
        >
          <HeartHandshake className="h-9 w-9" />
        </span>
      </div>
      <div className="enter enter-2 mx-auto mb-4">
        <Badge variant="gold">Founding Batch</Badge>
      </div>
      <h1 className="enter enter-2 font-heading text-3xl font-extrabold text-ink">
        Welcome to GoSkilled, {name ?? "friend"} 👋
      </h1>
      <p className="enter enter-3 mx-auto mt-3 max-w-sm text-muted">
        You&apos;re part of the Founding Batch. Let&apos;s start with a quick
        2-minute intro — then you&apos;re off.
      </p>

      <div className="enter enter-3 mt-8">
        <WelcomeActions needsName={!name} />
      </div>
    </main>
  );
}
