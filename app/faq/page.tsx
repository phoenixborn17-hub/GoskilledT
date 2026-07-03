// /faq — standalone, categorized FAQ (server component, no JS). Real answers only; the three
// founder-pending questions are documented in lib/marketing/faq.ts and intentionally NOT rendered.
import Link from "next/link";
import { pageMetadata, faqPageJsonLd } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { FaqAccordion } from "../../components/marketing/faq-accordion";
import { JsonLd } from "../../components/marketing/json-ld";
import { Button } from "../../components/ui/button";
import { FAQ_CATEGORIES } from "../../lib/marketing/faq";

const ALL_FAQS = FAQ_CATEGORIES.flatMap((c) => c.items);

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about GoSkilled pricing, GST-inclusive payments, the 48-hour refund, course access, OTP login, and more.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <JsonLd data={faqPageJsonLd(ALL_FAQS)} />
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-extrabold">
            Frequently asked questions
          </h1>
          {/* COPY: draft */}
          <p className="mt-2 text-muted">
            Straight answers — honest pricing, clear refunds, no surprises.
            Can&apos;t find yours?{" "}
            <Link href="/contact" className="font-semibold text-brand">
              Ask us
            </Link>
            .
          </p>
        </header>

        <div className="space-y-10">
          {FAQ_CATEGORIES.map((cat) => (
            <section key={cat.title} aria-labelledby={`faq-${cat.title}`}>
              <h2
                id={`faq-${cat.title}`}
                className="mb-3 font-heading text-xl font-bold"
              >
                {cat.title}
              </h2>
              <FaqAccordion items={cat.items} />
            </section>
          ))}
        </div>

        {/* Still-have-questions CTA */}
        <section className="reveal mt-12">
          <div className="rounded-2xl border border-charcoal/10 bg-brand p-6 text-center text-brand-fg">
            <h2 className="font-heading text-xl font-bold">
              Still have a question?
            </h2>
            <p className="mx-auto mt-1 max-w-md text-brand-fg">
              We&apos;re happy to help — reach out and we&apos;ll get back to
              you.
            </p>
            <div className="mx-auto mt-4 max-w-xs">
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-brand-fg/50 text-brand-fg hover:bg-white/15"
                >
                  Contact us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
