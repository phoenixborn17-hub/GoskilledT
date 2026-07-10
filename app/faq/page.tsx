// /faq — standalone, categorized, searchable FAQ. Real answers only (D-29); the founder-pending
// questions in lib/marketing/faq.ts are intentionally NOT rendered. JSON-LD stays server-rendered
// for SEO; the FaqBrowser client island adds search + category filtering on top. Re-skinned to the
// Public Experience standard (kit + shell).
import { HelpCircle } from "lucide-react";
import { pageMetadata, faqPageJsonLd } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { PageHero, Section, CtaBand } from "../../components/marketing/kit";
import { FaqBrowser } from "../../components/marketing/faq-browser";
import { JsonLd } from "../../components/marketing/json-ld";
import { FAQ_CATEGORIES } from "../../lib/marketing/faq";

const ALL_FAQS = FAQ_CATEGORIES.flatMap((c) => c.items);

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about GoSkilled pricing, payments, the 48-hour refund, course access, OTP login, and more.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <MarketingShell>
      <JsonLd data={faqPageJsonLd(ALL_FAQS)} />
      <main>
        <PageHero
          eyebrow="Help centre"
          eyebrowIcon={HelpCircle}
          title="Frequently asked questions"
          subtitle="Straight answers — honest pricing, clear refunds, no surprises."
        />
        <Section reveal={false} innerClassName="max-w-3xl">
          <FaqBrowser categories={FAQ_CATEGORIES} />
        </Section>
        <CtaBand
          title="Still have a question?"
          subtitle="We're happy to help — reach out and we'll get back to you."
          ctaHref="/contact"
          ctaLabel="Contact us"
          secondaryHref="/webinar"
          secondaryLabel="Join a free webinar"
        />
      </main>
    </MarketingShell>
  );
}
