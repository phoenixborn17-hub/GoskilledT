// Checkout screen (Ticket 3, Task 3 · DR-023). Server component: resolves the package from
// ?package= and (for Skill Builder) its selectable courses, then renders the OTP-inside form.
import type { Metadata } from "next";
import { prisma } from "../../lib/prisma";
import { formatINR } from "../../lib/money";
import { contactChannels } from "../../lib/config/contact";
import { TrustTriad } from "../../components/marketing/trust-triad";
import { CheckoutForm } from "./checkout-form";
import { BackLink } from "../../components/nav/back-link";

// Transactional page — keep out of search indexes (defence-in-depth beyond robots.txt).
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string; ref?: string }>;
}) {
  const { package: slug, ref } = await searchParams;

  const pkg = slug
    ? await prisma.package.findUnique({
        where: { slug },
        include: {
          courses: {
            include: {
              course: { select: { id: true, title: true, status: true } },
            },
          },
        },
      })
    : null;

  if (
    !pkg ||
    !pkg.isActive ||
    (pkg.slug !== "skill-builder" && pkg.slug !== "career-booster")
  ) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="text-center text-sm text-charcoal/70">
          Choose a package to continue. Add <code>?package=skill-builder</code>{" "}
          or <code>?package=career-booster</code>.
        </p>
      </main>
    );
  }

  const courses = pkg.courses.map((pc) => ({
    id: pc.course.id,
    title: pc.course.title,
    status: pc.course.status,
  }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <BackLink href="/packages" label="Back to packages" />
      <div className="mb-4 mt-4">
        <p className="font-heading text-h2 font-bold text-ink">{pkg.name}</p>
        <p className="text-h4 font-semibold text-theme-strong">
          {formatINR(pkg.priceInPaise)}
        </p>
        <p className="text-caption text-ink-muted">
          One-time payment · no hidden charges
        </p>
      </div>
      {/* Trust triad AT the pay decision (Amendments §G). */}
      <TrustTriad className="mb-5" />
      <CheckoutForm
        packageSlug={pkg.slug as "skill-builder" | "career-booster"}
        requiresCourseChoice={pkg.slug === "skill-builder"}
        courses={courses}
        referralCode={ref ?? null}
        contact={contactChannels(
          "Hi! I'd like a GoSkilled referral code to buy a package.",
        )}
      />
    </main>
  );
}
