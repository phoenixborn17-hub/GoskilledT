import Link from "next/link";
import { LegalPage } from "../../components/marketing/legal-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms for using GoSkilled.",
  path: "/terms",
});

// P-4 (Wave-2): honest STARTING draft. NOT final — must be reviewed and finalised by a lawyer
// before launch (LAUNCH_CONFIG #3). No income/earning guarantees anywhere (D-29).
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p className="rounded-lg border border-warning-strong/30 bg-warning-soft/40 px-4 py-3 text-warning-strong">
        <strong>DRAFT — pending legal review, not yet binding.</strong> This is
        a working draft published for transparency. It will be reviewed and
        finalised by legal counsel before it takes effect.
      </p>

      <p>
        These Terms govern your use of GoSkilled (&ldquo;the Platform&rdquo;),
        operated by <strong>EDZERA INSPIRING EXCELLENCE LLP</strong>
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or making a
        purchase, you agree to these Terms.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        1. Who can use GoSkilled
      </h2>
      <p>
        You must be at least 18 years old and able to enter into a binding
        contract. Accounts are created by invitation via a referral code. You
        are responsible for keeping your login credentials secure and for
        activity on your account.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        2. What we provide
      </h2>
      <p>
        GoSkilled offers online skill courses and related learning material.
        Access to paid courses is granted after a verified payment. We may add,
        update, or retire course content over time. Course outcomes depend on
        your own effort —{" "}
        <strong>we make no income, earning, or job guarantee</strong> of any
        kind.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        3. Payments
      </h2>
      <p>
        Prices are shown in Indian Rupees as a single, all-in amount with no
        hidden charges. Payments are processed by our payment partner
        (Razorpay); we do not store your card or banking credentials. Course
        access is unlocked only after your payment is confirmed.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        4. Refunds
      </h2>
      <p>
        Purchases are covered by our 48-hour refund window. See the{" "}
        <Link href="/refund-policy" className="text-brand underline">
          Refund Policy
        </Link>{" "}
        for the full details.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        5. Acceptable use
      </h2>
      <p>
        Do not share, resell, or redistribute course content or your account
        access. Do not misuse the Platform, attempt to break its security, or
        use it for anything unlawful. We may suspend accounts that violate these
        Terms.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        6. Intellectual property
      </h2>
      <p>
        All course content, branding, and material on the Platform belong to
        EDZERA INSPIRING EXCELLENCE LLP or its licensors and are provided for
        your personal, non-transferable use.
      </p>

      <h2 className="pt-2 font-heading text-lg font-bold text-charcoal">
        7. Changes and contact
      </h2>
      <p>
        We may update these Terms; material changes will be notified on the
        Platform. For any questions, reach us via the{" "}
        <Link href="/contact" className="text-brand underline">
          Contact
        </Link>{" "}
        page. Your privacy is covered by our{" "}
        <Link href="/privacy" className="text-brand underline">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPage>
  );
}
