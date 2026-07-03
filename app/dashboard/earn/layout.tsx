// Earn section layout (GPS-M3). Gold-forward affiliate surface (data-theme) + flag-aware sub-nav.
// noindex (authenticated). Money sub-nav tabs appear only when AFFILIATE_PAYOUTS_ENABLED (LC #18).
import type { Metadata } from "next";
import { payoutsEnabled } from "../../../lib/env";
import { EarnSubNav } from "../../../components/affiliate/earn-subnav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EarnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="affiliate" className="space-y-6">
      <EarnSubNav showMoney={payoutsEnabled()} />
      {children}
    </div>
  );
}
