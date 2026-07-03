import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({ title: "Privacy Policy", description: "How GoSkilled handles your data.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      {/* COPY: draft — full policy coming; Fable + legal to finalise */}
      <p>Content coming soon. We take your privacy seriously and will publish our full policy here before launch.</p>
    </LegalPage>
  );
}
