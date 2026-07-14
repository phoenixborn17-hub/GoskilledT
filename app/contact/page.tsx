// /contact — lead-capture form is primary (reuses LeadCaptureForm, source "contact", rate-limited).
// Direct-channel details are unblocked by the Phase 1B spec. Some values are temporary and flagged
// `// REPLACE:` — the office-address block is intentionally omitted until confirmed. Re-skinned to
// the Public Experience standard; the server action + form logic are untouched.
import { Suspense } from "react";
import { Clock, Mail, MessageCircle, MessagesSquare } from "lucide-react";
import { submitContact } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { Container } from "../../components/marketing/kit";
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
    <MarketingShell>
      <section className="hero-aurora">
        <Container className="py-14 text-center sm:py-16">
          <span className="enter inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand-deep">
            <MessagesSquare className="h-4 w-4" aria-hidden /> We&apos;re here
            to help
          </span>
          <h1 className="enter enter-2 mx-auto mt-4 max-w-2xl font-heading text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
            We&apos;d love to hear from you
          </h1>
          <p className="enter enter-3 mx-auto mt-4 max-w-xl text-lg text-muted">
            Question about a course, pricing, a refund, or your account? Leave
            your number and we&apos;ll get back to you.
          </p>
        </Container>
      </section>

      <Container className="grid gap-8 py-12 md:grid-cols-2">
        <section aria-labelledby="channels">
          <h2
            id="channels"
            className="font-heading text-xl font-bold text-ink"
          >
            Reach us directly
          </h2>
          {/* WhatsApp — primary channel for our audience (Phase 1B temp number). */}
          <a
            href="https://wa.me/918572887888"
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-4 flex items-center gap-3 rounded-gs-lg border border-brand/20 bg-brand/[0.04] p-4 hover:border-brand/40"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-ink">
                Chat on WhatsApp
              </span>
              {/* // REPLACE: temp */}
              <span className="block text-sm text-muted">+91 85728 87888</span>
            </span>
          </a>

          <Card className="mt-4 space-y-4">
            <ChannelRow Icon={Mail} label="Email">
              {/* // REPLACE: temp */}
              <a
                href="mailto:goskilled.in@gmail.com"
                className="font-semibold text-brand-deep hover:underline"
              >
                goskilled.in@gmail.com
              </a>
            </ChannelRow>
            <ChannelRow Icon={Clock} label="Business hours">
              {/* // REPLACE: confirm */}
              <span className="text-ink/80">Mon–Sat, 10:00–18:00 IST</span>
            </ChannelRow>
          </Card>
          <p className="mt-3 text-xs text-muted">
            We usually reply within one business day.
          </p>
        </section>

        <section aria-label="Send us a message">
          <h2 className="mb-4 font-heading text-xl font-bold text-ink">
            Send us a message
          </h2>
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
      </Container>
    </MarketingShell>
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
