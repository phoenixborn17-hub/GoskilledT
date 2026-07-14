import Link from "next/link";
import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How GoSkilled handles your data.",
  path: "/privacy",
});

// P-4 (Wave-2): honest STARTING draft. NOT final — must be reviewed and finalised by a lawyer
// before launch (LAUNCH_CONFIG #2). Describes real data flows (phone/OTP, Razorpay, Supabase).
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="rounded-lg border border-warning-strong/30 bg-warning-soft/40 px-4 py-3 text-warning-strong">
        <strong>DRAFT — pending legal review, not yet binding.</strong> This is
        a working draft published for transparency. It will be reviewed and
        finalised by legal counsel before it takes effect.
      </p>

      <p>
        This Policy explains how{" "}
        <strong>EDZERA INSPIRING EXCELLENCE LLP</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) handles your personal data when you use GoSkilled
        (&ldquo;the Platform&rdquo;).
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        1. What we collect
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Account details:</strong> your mobile number (verified by
          one-time password), and — if you provide them — your name, email, and
          learning goal.
        </li>
        <li>
          <strong>Payment information:</strong> processed by our payment partner
          (Razorpay). We receive a confirmation and order reference; we do{" "}
          <strong>not</strong> store your card or bank credentials.
        </li>
        <li>
          <strong>
            Payout / KYC details (only if you join the affiliate programme):
          </strong>{" "}
          identity and bank details you submit for verification.
        </li>
        <li>
          <strong>Usage data:</strong> course progress and basic analytics to
          run and improve the Platform.
        </li>
      </ul>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        2. How we use it
      </h2>
      <p>
        To create and secure your account, provide course access, process
        payments, respond to support requests, and comply with legal
        obligations. We do not sell your personal data.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        3. Processors we rely on
      </h2>
      <p>
        We use trusted service providers to run the Platform, including{" "}
        <strong>Supabase</strong> (authentication and database) and{" "}
        <strong>Razorpay</strong> (payments). These providers process data on
        our behalf under their own security commitments.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        4. How we protect it
      </h2>
      <p>
        Sensitive identity and bank details (such as PAN and account number) are
        encrypted at rest. Access is restricted to what is needed to operate the
        Platform, and we never include these details in our logs.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        5. Your choices
      </h2>
      <p>
        You can request access to, correction of, or deletion of your personal
        data, subject to legal and record-keeping requirements. Marketing emails
        include an unsubscribe link. To make a request, use the{" "}
        <Link href="/contact" className="text-brand underline">
          Contact
        </Link>{" "}
        page.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-ink">
        6. Changes
      </h2>
      <p>
        We may update this Policy; material changes will be notified on the
        Platform. Your use of GoSkilled is also governed by our{" "}
        <Link href="/terms" className="text-brand underline">
          Terms of Service
        </Link>
        .
      </p>
    </LegalPage>
  );
}
