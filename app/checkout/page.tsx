// Checkout screen (Ticket 3, Task 3 · DR-023). Server component: resolves the package from
// ?package= and (for Skill Builder) its selectable courses, then renders the OTP-inside form.
import type { Metadata } from "next";
import { prisma } from "../../lib/prisma";
import { formatINR } from "../../lib/money";
import { CheckoutForm } from "./checkout-form";

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
        include: { courses: { include: { course: { select: { id: true, title: true, status: true } } } } },
      })
    : null;

  if (!pkg || !pkg.isActive || (pkg.slug !== "skill-builder" && pkg.slug !== "career-booster")) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="text-center text-sm text-charcoal/70">
          Choose a package to continue. Add <code>?package=skill-builder</code> or <code>?package=career-booster</code>.
        </p>
      </main>
    );
  }

  const courses = pkg.courses.map((pc) => ({ id: pc.course.id, title: pc.course.title, status: pc.course.status }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-5">
        <p className="font-heading text-2xl font-bold text-charcoal">{pkg.name}</p>
        <p className="text-brand text-lg font-semibold">{formatINR(pkg.priceInPaise)}</p>
        <p className="text-xs text-muted">GST-inclusive · one-time</p>
      </div>
      <CheckoutForm
        packageSlug={pkg.slug as "skill-builder" | "career-booster"}
        requiresCourseChoice={pkg.slug === "skill-builder"}
        courses={courses}
        referralCode={ref ?? null}
      />
    </main>
  );
}
