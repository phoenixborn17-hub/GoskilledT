// /packages — THE MONEY PAGE (Ticket 5, Task 3 · Blueprint §7). Server component, read-only.
// Prices/refund/GST/composition copy is display-only and MUST match DR-010/021/023/025.
// D-29: value framing only — zero income claims. Escalation-flagged for review.
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { listPackages } from "../../lib/catalog/queries";
import { packageComparison, priceLabel } from "../../lib/catalog/shape";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export const metadata = pageMetadata({
  title: "Packages & Pricing",
  description: "Simple, GST-inclusive pricing. Skill Builder or Career Booster — no hidden charges, 48-hour refund.",
  path: "/packages",
});

// COPY: draft
const FAQS = [
  { q: "What is the refund policy?", a: "Full refund within 48 hours of purchase — no questions asked. After 48 hours, purchases are final." },
  { q: "Are there any hidden charges or GST?", a: "No. The price you see is the final price — GST is already included. Koi hidden charge nahi." },
  { q: "How quickly do I get access?", a: "Instantly. Your courses unlock within about 60 seconds of a successful payment." },
  { q: "How does course choice work?", a: "Skill Builder includes one launch course of your choice. Career Booster includes both launch courses, plus future courses as they are released." },
];

export default async function PackagesPage() {
  const packages = await listPackages();
  const sb = packages.find((p) => p.slug === "skill-builder");
  const cb = packages.find((p) => p.slug === "career-booster");

  if (!sb || !cb) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-md px-4 py-16 text-center text-muted">Packages are being set up. Please check back soon.</main>
        <SiteFooter />
      </>
    );
  }

  const rows = packageComparison(sb, cb);
  const extraForCb = cb.priceInPaise - sb.priceInPaise;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-10 md:pb-12">
        <header className="text-center">
          <h1 className="font-heading text-3xl font-extrabold">Simple, honest pricing</h1>
          {/* COPY: draft — DR-023 GST-inclusive */}
          <p className="mx-auto mt-2 max-w-xl text-muted">One price, GST included. Koi hidden charge nahi — and a 48-hour refund if it&apos;s not for you.</p>
        </header>

        {/* Pricing cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="lift flex flex-col">
            <h2 className="font-heading text-xl font-bold">{sb.name}</h2>
            <p className="mt-1 text-3xl font-extrabold text-charcoal">{priceLabel(sb.priceInPaise)}</p>
            <p className="text-xs text-muted">GST-inclusive · one-time</p>
            {/* COPY: draft — DR-021 */}
            <p className="mt-3 text-sm text-charcoal/70">One launch course of your choice. Perfect if you want to master a single skill.</p>
            <div className="mt-auto pt-4"><Link href="/checkout?package=skill-builder"><Button variant="outline">Choose Skill Builder</Button></Link></div>
          </Card>

          <Card className="lift flex flex-col border-brand ring-1 ring-brand">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">{cb.name}</h2>
              <Badge variant="gold">Recommended</Badge>
            </div>
            <p className="mt-1 text-3xl font-extrabold text-charcoal">{priceLabel(cb.priceInPaise)}</p>
            <p className="text-xs text-muted">GST-inclusive · one-time</p>
            {/* COPY: draft — DR-021 honest "as released"; value framing, NOT income (D-29) */}
            <p className="mt-3 text-sm text-charcoal/70">
              Both launch courses <strong>plus every future course as it&apos;s released</strong> — the second course and all
              future releases for just {priceLabel(extraForCb)} more.
            </p>
            <div className="mt-auto pt-4"><Link href="/checkout?package=career-booster"><Button>Choose Career Booster</Button></Link></div>
          </Card>
        </div>

        {/* Comparison table */}
        <section aria-labelledby="compare" className="reveal mt-10">
          <h2 id="compare" className="mb-3 font-heading text-xl font-bold">Compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-left">
                  <th scope="col" className="py-3 pr-4 font-medium text-muted">Feature</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{sb.name}</th>
                  <th scope="col" className="rounded-t-lg bg-brand/5 px-4 py-3 font-semibold text-brand">{cb.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b border-charcoal/5">
                    <th scope="row" className="py-3 pr-4 text-left font-normal text-muted">{r.feature}</th>
                    <td className="px-4 py-3">{cellValue(r.skillBuilder)}</td>
                    <td className={cn("bg-brand/5 px-4 py-3", r.highlight && "font-semibold text-brand")}>{cellValue(r.careerBooster)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ — native <details>, no JS */}
        <section aria-labelledby="faq" className="reveal mt-10">
          <h2 id="faq" className="mb-3 font-heading text-xl font-bold">Frequently asked</h2>
          <div className="space-y-2">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border border-charcoal/10 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-charcoal">
                  {f.q}
                  <span className="ml-2 text-brand transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky mobile CTA bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 p-3 md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Link href="/checkout?package=skill-builder" className="flex-1"><Button variant="outline">{priceLabel(sb.priceInPaise)}</Button></Link>
          <Link href="/checkout?package=career-booster" className="flex-1"><Button>Get {cb.name}</Button></Link>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}

function cellValue(v: string) {
  if (v === "Not included") return <Minus className="h-4 w-4 text-charcoal/30" aria-label="Not included" />;
  if (v === "Included as released" || v === "Included" || v.startsWith("Included")) {
    return <span className="inline-flex items-center gap-1"><Check className="h-4 w-4 text-brand" aria-hidden /> {v}</span>;
  }
  return v;
}
