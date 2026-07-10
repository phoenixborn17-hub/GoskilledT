// Earn section layout (GPS-M3 · Redesign U5). Gold-forward affiliate surface (data-theme), noindex.
// The old EarnSubNav tab bar is removed — the app shell's contextual sidebar (Nav_Workspace v1.1)
// is now the single Earn nav (no duplicate nav system).
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EarnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="affiliate" className="space-y-6">
      {children}
    </div>
  );
}
