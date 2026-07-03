// /contact — lead-capture form is primary (reuses LeadCaptureForm, source "contact", rate-limited).
// Direct-channel details are unblocked by the Phase 1B spec. Some values are temporary and flagged
// `// REPLACE:` — the office-address block is intentionally omitted until confirmed.
import { Suspense } from "react";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { submitContact } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { LeadCaptureForm } from "../../components/marketing/lead-capture-form";
import { Card } from "../../components/ui/card";

export const metadata = pageMetadata({
  title: "Contact us",
  description:
    "Have a question about GoSkilled courses, pricing, or your account? Leave your number and we'll get back to you.",
  path: "/contact",
});
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section>
          <h1 className="font-heading text-3xl font-extrabold leading-tight">
            We&apos;d love to hear from you
          </h1>
          {/* COPY: draft */}
          <p className="mt-2 text-muted">
            Question about a course, pricing, a refund, or your account? Leave
            your name and number and we&apos;ll get back to you.
          </p>

          {/* Direct-channel details (Phase 1B). Office-address block intentionally omitted
              (// REPLACE: pending). Email + WhatsApp are temporary (// REPLACE: temp); hours to
              confirm (// REPLACE: confirm). */}
          <Card className="mt-6 space-y-4 bg-brand/5">
            <ChannelRow Icon={Mail} label="Email">
              {/* // REPLACE: temp */}
              <a
                href="mailto:goskilled.in@gmail.com"
                className="font-semibold text-brand-deep hover:underline"
              >
                goskilled.in@gmail.com
              </a>
            </ChannelRow>
            <ChannelRow Icon={MessageCircle} label="WhatsApp">
              {/* // REPLACE: temp */}
              <a
                href="https://wa.me/918572887888"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-deep hover:underline"
              >
                +91 85728 87888
              </a>
            </ChannelRow>
            <ChannelRow Icon={Clock} label="Business hours">
              {/* // REPLACE: confirm */}
              <span className="text-charcoal/80">Mon–Sat, 10:00–18:00 IST</span>
            </ChannelRow>
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

function ChannelRow({
  Icon,
  label,
  children,
}: {
  Icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}
