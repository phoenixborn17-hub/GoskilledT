// Dashboard shell (Blueprint §3, §7 · Redesign U2 app shell). Server-side auth guard (defence in
// depth with middleware). The AppShell (sidebar · workspace switcher · top bar · mobile drawer +
// bottom bar · persistent Share · Guru entry) wraps the existing pages — presentation only, no
// route or business-logic change.
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/session";
import { prisma } from "../../lib/prisma";
import { siteUrl } from "../../lib/seo";
import { getVisibleFeatures } from "../../lib/feature-visibility/context";
import { AppShell } from "../../components/nav/app-shell";
import { InstallPrompt } from "../../components/pwa/install-prompt";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [record, completed, visibleFeatures] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, referralCode: true },
    }),
    // PWA install prompt (GPS-M5 §2.5) shows AFTER the first lesson — never on landing/marketing.
    prisma.lessonProgress.count({ where: { userId: user.id } }),
    // Feature Visibility (DR-040): resolve server-side, drive nav/share recomposition + hard-gate the
    // referral code out of the client payload entirely when the Affiliate layer is hidden.
    getVisibleFeatures(),
  ]);

  const affiliateVisible = visibleFeatures.earn === true;
  // When Affiliate is hidden the referral code/link never reach the client bundle (no source-of-page
  // trace for a reviewer) — the shell hides the Share affordance from this too.
  const referralCode = affiliateVisible ? (record?.referralCode ?? "") : "";
  const shareUrl = affiliateVisible
    ? `${siteUrl()}/register?ref=${referralCode}`
    : "";

  return (
    <>
      <AppShell
        userName={record?.name?.trim() || "You"}
        referralCode={referralCode}
        shareUrl={shareUrl}
        visibleFeatures={visibleFeatures}
      >
        {children}
      </AppShell>
      <InstallPrompt eligible={completed > 0} />
    </>
  );
}
