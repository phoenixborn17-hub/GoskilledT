// /contact — lead-capture form is READY (reuses LeadCaptureForm, source "contact", rate-limited).
// The direct-channel details (WhatsApp / email / phone / hours) are BLOCKED on a founder decision
// (which channel to publish). That block is a single labeled slot below — we do NOT invent a
// contact address (a fake/placeholder channel would be a broken promise; D-29 honesty).
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { submitContact } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { LeadCaptureForm } from "../../components/marketing/lead-capture-form";
import { Card } from "../../components/ui/card";

export const metadata = pageMetadata({
  title: "Contact us",
  description: "Have a question about GoSkilled courses, pricing, or your account? Leave your number and we'll get back to you.",
  path: "/contact",
});
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section>
          <h1 className="font-heading text-3xl font-extrabold leading-tight">We&apos;d love to hear from you</h1>
          {/* COPY: draft */}
          <p className="mt-2 text-muted">
            Question about a course, pricing, a refund, or your account? Leave your name and number
            and we&apos;ll get back to you.
          </p>

          {/* Direct-channel details — BLOCKED (founder decision on channel). Slot built; when the
              channel is chosen, render it here instead of the pending note. */}
          <Card className="mt-6 flex items-start gap-3 bg-brand/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand" aria-hidden>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">Our direct support channel is being set up</p>
              <p className="text-sm text-muted">Leave your details for now and we&apos;ll reach out. We usually respond within one business day.</p>
            </div>
          </Card>
        </section>

        <section aria-label="Send us a message">
          <Suspense>
            <LeadCaptureForm
              action={submitContact}
              requireName
              submitLabel="Send message"
              successTitle="Message received ✓"
              successBody="Thanks for reaching out — we'll get back to you within one business day."
              successCta={{ href: "/faq", label: "Meanwhile, see our FAQ" }}
            />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
