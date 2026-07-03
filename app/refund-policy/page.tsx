import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Refund Policy",
  description: "GoSkilled's 48-hour refund policy.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy">
      {/* COPY: draft — states the DR-025 policy accurately; full legal copy coming */}
      <p>
        <strong>48-hour refund window.</strong> If a purchase isn&apos;t right
        for you, request a full refund within 48 hours of payment — no questions
        asked.
      </p>
      <p>
        After 48 hours, purchases are final. The complete policy will be
        published here before launch.
      </p>
    </LegalPage>
  );
}
