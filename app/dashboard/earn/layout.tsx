// Earn section layout (GPS-M3 · Redesign U5). Gold-forward affiliate surface (data-theme), noindex.
// The old EarnSubNav tab bar is removed — the app shell's contextual sidebar (Nav_Workspace v1.1)
// is now the single Earn nav (no duplicate nav system).
//
// Feature Visibility (DR-040): this layout wraps EVERY /dashboard/earn/* route, so the guard here is
// the primary SERVER-SIDE ENFORCEMENT for the Affiliate layer — when `earn` is hidden for this user,
// the whole subtree (dashboard · network · wallet · commissions · leaderboard · rewards · leads ·
// commission-structure · KYC) is UNREACHABLE (404 via notFound()), not merely nav-hidden. Individual
// server actions / route handlers under this tree re-assert the same guard (a POST can skip a layout).
import type { Metadata } from "next";
import { assertFeatureVisible } from "../../../lib/feature-visibility/context";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EarnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertFeatureVisible("earn");
  return (
    <div data-theme="affiliate" className="space-y-6">
      {children}
    </div>
  );
}
