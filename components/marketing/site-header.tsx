// Marketing site header (server component, links only — zero client JS). Sticky, mobile-first.
// Desktop (md+): inline primary nav + Log in. Mobile: CSS-only <details> disclosure menu
// (keyboard-toggleable, no JS, no hydration cost). Nav set per Blueprint: Courses, Packages,
// Webinar, Earn, About, FAQ.
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/webinar", label: "Webinar" },
  { href: "/earn", label: "Earn" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-30 border-b border-line/10">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-bold text-brand">
          GoSkilled
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="press rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="ml-1">
            <span className="press inline-flex h-9 items-center rounded-xl border border-brand/30 px-4 text-sm font-semibold text-ink hover:bg-brand/5">
              Log in
            </span>
          </Link>
          {/* DR-030: free registration is the primary public CTA. */}
          <Link href="/register">
            <span className="press inline-flex h-9 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand/90">
              Register free
            </span>
          </Link>
        </nav>

        {/* Mobile menu — CSS-only <details> disclosure, no JS */}
        <details className="group relative md:hidden">
          <summary
            aria-label="Open menu"
            className="press flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-ink hover:bg-charcoal/5 [&::-webkit-details-marker]:hidden"
          >
            <Menu className="h-6 w-6 group-open:hidden" aria-hidden />
            <X className="hidden h-6 w-6 group-open:block" aria-hidden />
          </summary>
          <nav
            aria-label="Primary"
            className="glass absolute right-0 top-12 w-56 rounded-gs-lg border border-line/10 p-2 shadow-lg"
          >
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-brand/5 hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-1 space-y-1 border-t border-line/10 pt-2">
              <Link
                href="/register"
                className="block rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-semibold text-brand-fg"
              >
                Register free
              </Link>
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
              >
                Log in →
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}

/** Full-width primary CTA used in section footers. */
export function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}) {
  return (
    <Link href={href} className="block">
      <Button variant={variant}>{children}</Button>
    </Link>
  );
}
