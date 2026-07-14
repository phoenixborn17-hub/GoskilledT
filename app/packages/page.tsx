// /packages — THE MONEY PAGE (Ticket 5, Task 3 · Blueprint §7). Server component, read-only.
// Prices/refund/composition copy is display-only and MUST match DR-010/021/025.
// COMPLIANCE (founder 2026-07-11): the LLP is NOT GST-registered yet, so NO "GST-inclusive" copy —
// use "one price · no hidden charges" framing. Do not re-add GST wording until registration confirmed.
// D-29: value framing only — zero income claims. Re-skinned to Public Experience standard; NO money
// logic touched (checkout links + prices come straight from listPackages). Escalation-flagged.
import Link from "next/link";
import {
  Check,
  Minus,
  Tag,
  ShieldCheck,
  Lock,
  BadgeIndianRupee,
  Zap,
  Star,
} from "lucide-react";
import { listPackages } from "../../lib/catalog/queries";
import { packageComparison, priceLabel } from "../../lib/catalog/shape";
import { pageMetadata } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { Container, Section } from "../../components/marketing/kit";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export const metadata = pageMetadata({
  title: "Packages & Pricing",
  description:
    "Simple, honest pricing — no hidden charges. Skill Builder or Career Booster, 48-hour refund.",
  path: "/packages",
});

const FAQS = [
  {
    q: "What is the refund policy?",
    a: "Full refund within 48 hours of purchase — no questions asked. After 48 hours, purchases are final.",
  },
  {
    q: "Are there any hidden charges?",
    a: "No. The price you see is the final price — one payment, no hidden charges. Koi hidden charge nahi.",
  },
  {
    q: "How quickly do I get access?",
    a: "Instantly. Your courses unlock within about 60 seconds of a successful payment.",
  },
  {
    q: "How does course choice work?",
    a: "Skill Builder includes one launch course of your choice. Career Booster includes both launch courses, plus future courses as they are released.",
  },
];

export default async function PackagesPage() {
  const packages = await listPackages();
  const sb = packages.find((p) => p.slug === "skill-builder");
  const cb = packages.find((p) => p.slug === "career-booster");

  if (!sb || !cb) {
    return (
      <MarketingShell>
        <main className="mx-auto w-full max-w-md px-4 py-16 text-center text-muted">
          Packages are being set up. Please check back soon.
        </main>
      </MarketingShell>
    );
  }

  const rows = packageComparison(sb, cb);
  const extraForCb = cb.priceInPaise - sb.priceInPaise;

  return (
    <MarketingShell>
      <main>
        {/* Hero */}
        <section className="hero-aurora">
          <Container className="py-14 text-center sm:py-20">
            <span className="enter inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand-deep">
              <BadgeIndianRupee className="h-3.5 w-3.5" /> One price · no hidden
              charges
            </span>
            <h1 className="enter enter-2 mx-auto mt-4 max-w-2xl font-heading text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl">
              Simple, honest pricing
            </h1>
            <p className="enter enter-2 mx-auto mt-4 max-w-xl text-lg text-ink/70">
              One price, no hidden charges. Koi hidden charge nahi — and a
              48-hour refund if it&apos;s not for you.
            </p>
            <p className="enter enter-3 mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-semibold text-ink">
              <Star className="h-4 w-4" aria-hidden />
              Exclusive Founding Batch pricing — limited founding seats
            </p>
          </Container>
        </section>

        {/* Pricing cards */}
        <Container className="pb-4">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Skill Builder */}
            <Card className="lift flex flex-col">
              <h2 className="font-heading text-xl font-bold text-ink">
                {sb.name}
              </h2>
              <p className="mt-3 text-4xl font-extrabold text-ink">
                {priceLabel(sb.priceInPaise)}
              </p>
              <p className="text-xs text-muted">
                One-time payment · no hidden charges
              </p>
              <p className="mt-4 text-sm text-ink/70">
                One launch course of your choice. Perfect if you want to master
                a single skill first.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink/80">
                <Feature>1 launch course (your choice)</Feature>
                <Feature>Verifiable certificate on completion</Feature>
                <Feature>Learn on your phone, at your own pace</Feature>
                <Feature>48-hour refund</Feature>
              </ul>
              <p className="mt-4 rounded-lg bg-brand/[0.04] px-3 py-2 text-xs text-muted">
                Best for: focused learners starting with one specific skill.
              </p>
              <div className="mt-auto pt-5">
                <Link href="/checkout?package=skill-builder">
                  <Button variant="outline">Choose {sb.name}</Button>
                </Link>
              </div>
            </Card>

            {/* Career Booster — recommended */}
            <Card className="lift relative flex flex-col border-brand ring-1 ring-brand">
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-fg">
                <Zap className="h-3 w-3" aria-hidden /> Recommended
              </span>
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-ink">
                  {cb.name}
                </h2>
                <Badge variant="gold">Best value</Badge>
              </div>
              <p className="mt-3 text-4xl font-extrabold text-ink">
                {priceLabel(cb.priceInPaise)}
              </p>
              <p className="text-xs text-muted">
                One-time payment · no hidden charges
              </p>
              <p className="mt-4 text-sm text-ink/70">
                Both launch courses{" "}
                <strong>plus every future course as it&apos;s released</strong>{" "}
                — the second course and all future releases for just{" "}
                {priceLabel(extraForCb)} more.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink/80">
                <Feature>Both launch courses</Feature>
                <Feature strong>Future courses included as released</Feature>
                <Feature>Verifiable certificates</Feature>
                <Feature>48-hour refund</Feature>
              </ul>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-xs font-medium text-ink">
                <Tag className="h-3.5 w-3.5" aria-hidden />
                Every future course for {priceLabel(extraForCb)} more than Skill
                Builder
              </p>
              <div className="mt-auto pt-5">
                <Link href="/checkout?package=career-booster">
                  <Button>Choose {cb.name}</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Payment trust row — refund + secure checkout only (no unverified badges, D-29) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand" aria-hidden /> 48-hour
              refund, no questions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-brand" aria-hidden /> Secure
              checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeIndianRupee className="h-4 w-4 text-brand" aria-hidden />{" "}
              One-time payment · no hidden charges
            </span>
          </div>
        </Container>

        {/* Comparison table */}
        <Section aria-labelledby="compare" innerClassName="max-w-4xl">
          <h2
            id="compare"
            className="mb-4 font-heading text-2xl font-bold text-ink"
          >
            Compare plans
          </h2>
          <div className="overflow-x-auto rounded-gs-lg border border-line/10 bg-surface-raised">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line/10 text-left">
                  <th scope="col" className="p-4 font-medium text-muted">
                    Feature
                  </th>
                  <th scope="col" className="p-4 font-semibold text-ink">
                    {sb.name}
                  </th>
                  <th
                    scope="col"
                    className="bg-brand/[0.04] p-4 font-semibold text-brand-deep"
                  >
                    {cb.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b border-line/5">
                    <th
                      scope="row"
                      className="p-4 text-left font-normal text-muted"
                    >
                      {r.feature}
                    </th>
                    <td className="p-4 text-ink/80">
                      {cellValue(r.skillBuilder)}
                    </td>
                    <td
                      className={cn(
                        "bg-brand/[0.04] p-4",
                        r.highlight
                          ? "font-semibold text-brand-deep"
                          : "text-ink/80",
                      )}
                    >
                      {cellValue(r.careerBooster)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* FAQ */}
        <Section aria-labelledby="faq" bg="raised" innerClassName="max-w-3xl">
          <h2
            id="faq"
            className="mb-4 font-heading text-2xl font-bold text-ink"
          >
            Frequently asked
          </h2>
          <div className="space-y-2">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-line/10 bg-surface-raised p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
                  {f.q}
                  <span
                    className="ml-2 text-brand transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      </main>

      {/* Sticky mobile CTA bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/10 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Link
            href="/checkout?package=skill-builder"
            className="press inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-brand/30 text-sm font-semibold text-ink"
          >
            {priceLabel(sb.priceInPaise)}
          </Link>
          <Link
            href="/checkout?package=career-booster"
            className="press inline-flex h-11 flex-[1.3] items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-fg"
          >
            Get {cb.name}
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}

function Feature({
  children,
  strong,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <span className={cn(strong && "font-semibold text-ink")}>
        {children}
      </span>
    </li>
  );
}

function cellValue(v: string) {
  if (v === "Not included")
    return (
      <Minus className="h-4 w-4 text-ink/30" aria-label="Not included" />
    );
  if (
    v === "Included as released" ||
    v === "Included" ||
    v.startsWith("Included")
  ) {
    return (
      <span className="inline-flex items-center gap-1">
        <Check className="h-4 w-4 text-brand" aria-hidden /> {v}
      </span>
    );
  }
  return v;
}
