// Marketing kit — shared, on-token building blocks for every public page (Public Experience
// foundation). Server components (zero client JS) so pages stay LCP-light. One vocabulary of
// section rhythm, headings, eyebrows, bento cards and CTA bands → the Consistency Test passes by
// construction. Tokens only (--gs-*/Tailwind theme); no ad-hoc colours. D-29: copy stays honest.
import * as React from "react";
import Link from "next/link";
import { ShieldCheck, ReceiptText, BadgeCheck } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/** Max-width content container (matches the 1200–1280px system grid). */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4", className)}>
      {children}
    </div>
  );
}

type SectionBg = "default" | "raised" | "tint";
const sectionBg: Record<SectionBg, string> = {
  default: "",
  raised: "bg-white",
  tint: "bg-brand/[0.03]",
};

/** A page section with consistent vertical rhythm + optional background + reveal-on-scroll. */
export function Section({
  id,
  bg = "default",
  reveal = true,
  container = true,
  className,
  innerClassName,
  "aria-labelledby": ariaLabelledby,
  "aria-label": ariaLabel,
  children,
}: {
  id?: string;
  bg?: SectionBg;
  reveal?: boolean;
  container?: boolean;
  className?: string;
  innerClassName?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}) {
  const inner = container ? (
    <Container className={innerClassName}>{children}</Container>
  ) : (
    children
  );
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      className={cn(
        "py-16 sm:py-20",
        sectionBg[bg],
        reveal && "reveal",
        className,
      )}
    >
      {inner}
    </section>
  );
}

/** Small pill label above a heading. Decorative icon optional. */
export function Eyebrow({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand-deep",
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

/** Section heading block: optional eyebrow → title → subtitle. `id` wires aria-labelledby. */
export function SectionHeading({
  id,
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  align = "left",
  className,
}: {
  id?: string;
  eyebrow?: string;
  eyebrowIcon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow icon={eyebrowIcon} className="mb-3">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        id={id}
        className="font-heading text-2xl font-bold text-charcoal sm:text-3xl"
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-3 text-muted",
            align === "center" && "mx-auto max-w-xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Bento card — a soft, elevated surface with hover-lift when it links somewhere. */
export function BentoCard({
  className,
  interactive = false,
  children,
}: {
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-charcoal/10 bg-white p-6 shadow-gs-sm",
        interactive && "lift hover:border-brand/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Honest trust chips — only true claims (D-29 + charter honesty lock). Reused site-wide. */
export function TrustChips({ className }: { className?: string }) {
  const marks = [
    { icon: ShieldCheck, label: "Registered LLP" },
    { icon: ReceiptText, label: "GST-inclusive pricing" },
    { icon: BadgeCheck, label: "48-hour refund" },
  ];
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted",
        className,
      )}
    >
      {marks.map((m) => (
        <li key={m.label} className="inline-flex items-center gap-1.5">
          <m.icon className="h-4 w-4 text-brand" aria-hidden />
          {m.label}
        </li>
      ))}
    </ul>
  );
}

/** Reusable page hero for non-home marketing pages (aurora backdrop + eyebrow/title/subtitle/CTAs). */
export function PageHero({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  children,
  align = "center",
}: {
  eyebrow?: string;
  eyebrowIcon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="hero-aurora">
      <Container className="py-16 sm:py-20">
        <div
          className={cn(
            "max-w-2xl",
            align === "center" && "mx-auto text-center",
          )}
        >
          {eyebrow ? (
            <Eyebrow icon={eyebrowIcon} className="enter mb-4">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1 className="enter enter-2 font-heading text-4xl font-extrabold leading-[1.08] text-charcoal sm:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "enter enter-2 mt-4 text-lg text-charcoal/70",
                align === "center" && "mx-auto max-w-xl",
              )}
            >
              {subtitle}
            </p>
          ) : null}
          {children ? (
            <div className="enter enter-3 mt-8">{children}</div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/** Final CTA band — one primary action, on brand. `tone` picks the surface. */
export function CtaBand({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section aria-label="Get started" bg="raised">
      <div className="mx-auto max-w-3xl rounded-3xl border border-brand/15 bg-gradient-to-br from-brand/[0.06] to-gold/[0.05] px-6 py-12 text-center sm:px-10">
        <h2 className="font-heading text-2xl font-extrabold text-charcoal sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-xl text-muted">{subtitle}</p>
        ) : null}
        <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={ctaHref} className="sm:w-52">
            <Button>{ctaLabel}</Button>
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="sm:w-52">
              <Button variant="outline">{secondaryLabel}</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
