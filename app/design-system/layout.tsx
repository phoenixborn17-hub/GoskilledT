import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/session";

// Internal design-system reference (Redesign U1 founder visual pass) — never indexed, not a
// product surface. Kept out of search + crawlers. It renders sample components INCLUDING Affiliate/
// Earn samples with illustrative money/commission figures, so it must never be reachable
// UNAUTHENTICATED (a Razorpay/AdSense/compliance crawler must not see commission numbers — DR-040 /
// D-29). This server layout gates the whole route behind a login; the showcase page is unchanged.
export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/design-system");
  return <>{children}</>;
}
