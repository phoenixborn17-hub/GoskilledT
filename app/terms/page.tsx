import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({ title: "Terms of Service", description: "The terms for using GoSkilled.", path: "/terms" });

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      {/* COPY: draft — full terms coming; Fable + legal to finalise */}
      <p>Content coming soon. Our full terms of service will be published here before launch.</p>
    </LegalPage>
  );
}
