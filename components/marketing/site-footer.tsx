// Marketing footer (server component). Full sitemap + legal + "Made in India" line.
// Legal links must never 404 (stub pages exist). Social links are an EXTERNAL DEPENDENCY —
// SOCIALS is intentionally empty until the founder provides real handles; the render slot
// below is built and simply shows nothing until then (never a dead/placeholder link).
import Link from "next/link";

const EXPLORE = [
  { href: "/courses", label: "Courses" },
  { href: "/packages", label: "Packages" },
  { href: "/webinar", label: "Free webinar" },
  { href: "/faq", label: "FAQ" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/earn", label: "Earn with us" },
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/contact", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

// EXTERNAL DEP (founder): real social handles. Empty = the "Follow us" block renders nothing.
const SOCIALS: { href: string; label: string }[] = [];

const YEAR = "2026";

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/10 bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <p className="font-heading text-lg font-bold text-brand">
              GoSkilled
            </p>
            {/* COPY: draft — D-29 honest positioning */}
            <p className="mt-2 text-sm text-muted">
              We sell skills, not dreams. Practical courses in simple Hinglish —
              honest, GST-inclusive pricing and a 48-hour refund window.
            </p>
            {SOCIALS.length > 0 && (
              <nav aria-label="Social" className="mt-4 flex gap-3">
                {SOCIALS.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="text-sm text-charcoal/70 hover:text-brand"
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <FooterNav label="Explore" links={EXPLORE} />
          <FooterNav label="Company" links={COMPANY} />
          <FooterNav label="Legal" links={LEGAL} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-charcoal/5 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} GoSkilled. All rights reserved.</p>
          {/* Made in India — brand identity line */}
          <p className="inline-flex items-center gap-1.5">
            Made in India <span aria-hidden>🇮🇳</span> for India
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-sm text-charcoal/70 hover:text-brand"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
