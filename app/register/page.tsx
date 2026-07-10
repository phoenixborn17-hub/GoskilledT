import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { resolveSponsorByCode } from "../../lib/auth/sponsor";
import { readRefCookie } from "../../lib/auth/ref-cookie";
import { isFeatureVisible } from "../../lib/feature-visibility/context";
import { contactChannels } from "../../lib/config/contact";
import { pageMetadata } from "../../lib/seo";

// Public + indexable. Invite-only (DR-036): a valid referral code is required to register — the
// no-code state points visitors to a referrer/support. Final copy is a LAUNCH_CONFIG slot.
export const metadata = pageMetadata({
  title: "Register — GoSkilled",
  description:
    "GoSkilled is invite-only. Register with a referral code, your mobile number and a password to start learning.",
  path: "/register",
});

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // Resolve the referral code from ?ref=, falling back to the first-touch cookie (DR-030 §2) so an
  // affiliate link followed by header navigation (which drops the query) still auto-opens the form
  // on the details step with a warm "Invited by …". Absent/invalid → the no-code + manual-entry state.
  const initialCode = ref?.trim() || (await readRefCookie()) || "";
  const sponsor = initialCode ? await resolveSponsorByCode(initialCode) : null;
  const contact = contactChannels(
    "Hi! I'd like a GoSkilled referral code to register.",
  );
  // Feature Visibility (DR-040 · the /register?ref attribution surface): when the Affiliate layer is
  // GLOBALLY hidden (a review window / pre-legal), suppress the visible referral framing ("Invited by
  // [name] ✓") so a reviewer sees no referral mechanics. Anonymous context → GLOBAL overrides only.
  // Registration LOGIC (DR-036 invite-only code requirement + attribution) is unchanged.
  const affiliateVisible = await isFeatureVisible("earn");
  const sponsorFirstName = affiliateVisible
    ? (sponsor?.firstName ?? null)
    : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Suspense>
        <RegisterForm
          initialCode={initialCode}
          initialValid={!!sponsor}
          initialSponsorFirstName={sponsorFirstName}
          contact={contact}
        />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </main>
  );
}
