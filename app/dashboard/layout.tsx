// Dashboard shell (Blueprint §3, §7 · Redesign U2 app shell). Server-side auth guard (defence in
// depth with middleware). The AppShell (sidebar · workspace switcher · top bar · mobile drawer +
// bottom bar · persistent Share · Guru entry) wraps the existing pages — presentation only, no
// route or business-logic change.
import { redirect } from "next/navigation";
import { getCurrentUser, AuthUnavailableError } from "../../lib/auth/session";
import { prisma } from "../../lib/prisma";
import { siteUrl } from "../../lib/seo";
import { getVisibleFeatures } from "../../lib/feature-visibility/context";
import { getShellState } from "../../lib/nav/shell-state";
import { AppShell } from "../../components/nav/app-shell";
import { InstallPrompt } from "../../components/pwa/install-prompt";
import { AuthUnavailableScreen } from "../../components/auth/auth-unavailable-screen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next.js error.tsx boundaries do NOT catch errors thrown in a layout of the same segment, so
  // the transient-vs-signed-out distinction (2026-07-15 login-bounce fix) is handled inline here
  // rather than relying on app/dashboard/error.tsx (which still exists for errors from pages/
  // actions further down this tree).
  let user;
  try {
    user = await getCurrentUser();
  } catch (e) {
    if (e instanceof AuthUnavailableError) return <AuthUnavailableScreen />;
    throw e;
  }
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

  const userName = record?.name?.trim() || "You";
  // Sidebar snapshots + honest switcher pips (Command_Center_Spec §1.2 R2/R3) — composed from
  // existing reads; the layout persists across client navigations so this runs on hard loads only.
  const shellState = await getShellState(user.id, userName, affiliateVisible);

  return (
    <>
      <AppShell
        userName={userName}
        referralCode={referralCode}
        shareUrl={shareUrl}
        visibleFeatures={visibleFeatures}
        snapshots={shellState.snapshots}
        pips={shellState.pips}
      >
        {children}
      </AppShell>
      <InstallPrompt eligible={completed > 0} />
    </>
  );
}
