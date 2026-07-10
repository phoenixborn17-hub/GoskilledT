// Premium split-screen auth shell (Public Experience charter). Left = brand-story / benefits panel
// (dark green→charcoal — gold accents are allowed here since the surface is dark, not light: Golden
// Rule 14 holds). Right = the existing auth form, untouched. Pure presentation wrapper: it takes the
// logic-bearing <LoginForm>/<RegisterForm> as children and changes ZERO auth logic/validation.
import * as React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Smartphone, BadgeCheck } from "lucide-react";

const DEFAULT_POINTS = [
  { icon: Smartphone, text: "Learn on your phone, in simple Hinglish" },
  { icon: BadgeCheck, text: "Verifiable certificates — proof of real skill" },
  { icon: ShieldCheck, text: "Honest, GST-inclusive pricing · 48-hour refund" },
];

export function AuthShell({
  heading,
  subheading,
  points = DEFAULT_POINTS,
  children,
}: {
  heading: string;
  subheading: string;
  points?: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-green-800 via-green-900 to-charcoal p-12 lg:flex lg:flex-col lg:justify-between">
        {/* soft light pools */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-green-500/20 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
        />
        <Link
          href="/"
          className="relative font-heading text-xl font-bold text-white"
        >
          GoSkilled
        </Link>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Making potential
            visible
          </span>
          <h2 className="mt-4 max-w-sm font-heading text-3xl font-extrabold leading-tight text-white">
            {heading}
          </h2>
          <p className="mt-3 max-w-sm text-white/70">{subheading}</p>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li
                key={p.text}
                className="flex items-center gap-3 text-white/90"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          EDZERA INSPIRING EXCELLENCE LLP · Registered LLP · MSME Registered
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-offwhite px-5 py-10 sm:px-10">
        {/* Mobile brand header */}
        <Link
          href="/"
          className="mb-8 inline-block font-heading text-xl font-bold text-brand lg:hidden"
        >
          GoSkilled
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
