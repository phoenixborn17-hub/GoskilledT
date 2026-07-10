// Branded 404 (server component). Helpful links back into the site — never a dead end. Re-skinned to
// the Public Experience standard (shell + aurora + support channel).
import Link from "next/link";
import { Compass, MessageCircle } from "lucide-react";
import { MarketingShell } from "../components/marketing/marketing-shell";
import { Container } from "../components/marketing/kit";
import { Button } from "../components/ui/button";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <MarketingShell>
      <main className="hero-aurora">
        <Container className="flex flex-col items-center py-24 text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"
            aria-hidden
          >
            <Compass className="h-8 w-8" />
          </div>
          <p className="font-heading text-6xl font-extrabold text-brand-gradient">
            404
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold text-charcoal">
            This page took a wrong turn
          </h1>
          <p className="mt-2 max-w-md text-muted">
            The page you&apos;re looking for doesn&apos;t exist or may have
            moved. Let&apos;s get you back on track.
          </p>

          <div className="mt-6 w-full max-w-xs">
            <Link href="/">
              <Button>Back to home</Button>
            </Link>
          </div>

          <nav
            aria-label="Helpful links"
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-charcoal/15 px-4 py-1.5 text-sm font-medium text-charcoal/70 transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
            Still stuck?{" "}
            <Link href="/contact" className="font-semibold text-brand">
              Contact support
            </Link>
          </p>
        </Container>
      </main>
    </MarketingShell>
  );
}
