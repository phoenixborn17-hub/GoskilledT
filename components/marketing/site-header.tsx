// Marketing site header (server component, links only). Sticky, mobile-first.
import Link from "next/link";
import { Button } from "../ui/button";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-30">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-lg font-bold text-brand">GoSkilled</Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Link href="/courses" className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:text-brand">Courses</Link>
          <Link href="/packages" className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:text-brand">Packages</Link>
          <Link href="/login" className="ml-1 hidden sm:block">
            <span className="inline-flex h-9 items-center rounded-xl border border-brand/30 px-4 text-sm font-semibold text-charcoal hover:bg-brand/5">Log in</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Full-width primary CTA used in section footers. */
export function CtaButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "outline" }) {
  return (
    <Link href={href} className="block">
      <Button variant={variant}>{children}</Button>
    </Link>
  );
}
