// Metadata carrier for /onboarding. The page itself is a client component (interactive form) and
// so can't export metadata — a layout can. Onboarding is a private, post-purchase step: keep it
// out of search indexes (defence-in-depth beyond robots.txt).
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
