import type { Metadata } from "next";

// Internal design-system reference (Redesign U1 founder visual pass) — never indexed, not a
// product surface. Kept out of search + crawlers.
export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
