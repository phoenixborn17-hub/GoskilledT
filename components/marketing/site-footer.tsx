// Marketing footer (server component) — premium sitemap + trust + honest company identity.
// Legal links must never 404 (stub pages exist). Social links are an EXTERNAL DEPENDENCY — SOCIALS
// is intentionally empty until the founder provides real handles; the render slot is built and shows
// nothing until then (never a dead/placeholder link). Company line shows ONLY confirmed-true marks
// (charter honesty lock): Registered LLP (EDZERA INSPIRING EXCELLENCE LLP) + MSME Registered — never
// "Government Approved/Endorsed", no GST / Startup-India (not obtained). D-29 tagline stated proudly.
import Link from "next/link";
import { ShieldCheck, ReceiptText, BadgeCheck } from "lucide-react";
import { Monogram } from "./monogram";

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
      {/* Trust ribbon — only true claims. */}
      <div className="border-b border-charcoal/5 bg-brand/[0.03]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-xs font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
            48-hour refund
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ReceiptText className="h-4 w-4 text-brand" aria-hidden />
            GST-inclusive pricing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-brand" aria-hidden />
            No income guarantees — we sell skills, not dreams
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="max-w-sm lg:col-span-2">
            <div className="flex items-center gap-3">
              <Monogram name="Go Skilled" className="h-10 w-10 text-base" />
              <p className="font-heading text-lg font-bold text-brand">
                GoSkilled
              </p>
            </div>
            {/* Brand statement (Phase 1B — verbatim footer tagline) */}
            <p className="mt-3 text-sm text-muted">
              We will never sell dreams. We will help you build skills that
              create opportunities.
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

        {/* Honest company identity (confirmed marks only). */}
        <div className="mt-10 rounded-2xl border border-charcoal/10 bg-brand/[0.02] px-5 py-4 text-xs text-muted">
          <p className="font-semibold text-charcoal/80">
            EDZERA INSPIRING EXCELLENCE LLP
          </p>
          <p className="mt-1">
            Registered LLP · MSME Registered. GoSkilled is a product of EDZERA
            INSPIRING EXCELLENCE LLP.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-charcoal/5 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} GoSkilled. All rights reserved.</p>
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
          className="text-sm text-charcoal/70 transition-colors hover:text-brand"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
