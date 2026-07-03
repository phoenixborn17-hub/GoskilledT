import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description: "GoSkilled makes no income guarantees.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      {/* COPY: draft — states D-29 clearly; full copy coming */}
      <p>
        <strong>No income guarantees.</strong> GoSkilled sells educational
        skills, not income. We do not promise or guarantee any earnings, jobs,
        or financial outcomes.
      </p>
      <p>
        Your results depend on your own effort and circumstances. The complete
        disclaimer will be published here before launch.
      </p>
    </LegalPage>
  );
}
