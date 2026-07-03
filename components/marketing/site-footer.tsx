// Marketing footer (server component). Legal links must never 404 (stub pages exist).
import Link from "next/link";

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/10 bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-heading text-lg font-bold text-brand">GoSkilled</p>
            {/* COPY: draft */}
            <p className="mt-2 text-sm text-charcoal/60">
              We sell skills, not dreams. Practical courses with honest, GST-inclusive pricing and a
              48-hour refund window.
            </p>
          </div>

          <div className="flex gap-10">
            <nav aria-label="Explore" className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/40">Explore</p>
              <Link href="/courses" className="text-sm text-charcoal/70 hover:text-brand">Courses</Link>
              <Link href="/packages" className="text-sm text-charcoal/70 hover:text-brand">Packages</Link>
              <Link href="/webinar" className="text-sm text-charcoal/70 hover:text-brand">Free webinar</Link>
              <Link href="/earn" className="text-sm text-charcoal/70 hover:text-brand">Earn with us</Link>
            </nav>
            <nav aria-label="Legal" className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/40">Legal</p>
              {LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-charcoal/70 hover:text-brand">{l.label}</Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-charcoal/5 pt-6 text-xs text-charcoal/50 sm:flex-row sm:items-center sm:justify-between">
          {/* COPY: draft — contact + social placeholders */}
          <p>Contact: hello@goskilled.example (placeholder)</p>
          <p>© {"2026"} GoSkilled. Social links coming soon.</p>
        </div>
      </div>
    </footer>
  );
}
