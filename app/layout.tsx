import type { Metadata, Viewport } from "next";
import { Sora, Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { siteUrl, SITE_NAME } from "../lib/seo";
import { PwaRegister } from "../components/pwa/pwa-register";
import { StagingBanner } from "../components/system/staging-banner";

// Brand fonts (DR-012), self-hosted via next/font: zero layout-shift setup, `swap` so text
// is never invisible, and subset to latin + devanagari only (data-light for Tier-2/3 users).
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — Learn in-demand skills`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Practical, job-ready skills in Hinglish — learn at your own pace.", // D-29: no income claims/guarantees
  // PWA (GPS-M5 §2.5). The manifest link is auto-injected from app/manifest.ts.
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: SITE_NAME },
};

// Mobile-first: design from 320px up (DESIGN_DIRECTION.md).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#137E49",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${devanagari.variable}`}
      // QA-01 hydration fix: next/font injects the font-variable classNames on <html> and browser
      // extensions mutate <html>/<body> attributes before React hydrates, so the html element's OWN
      // attributes can legitimately differ SSR→client (a dev-mode next/font artifact — the QA harness
      // runs `npm run dev`). This is the Next.js/React-documented remedy and is scoped to <html>'s
      // attributes only (one level deep): child mismatches still warn, so real bugs are never masked.
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-offwhite font-body text-charcoal antialiased">
        {/* Skip link (WCAG 2.4.1 Bypass Blocks) — first focusable element, hidden until focused.
            Targets a single layout-level landmark so every route is covered without page edits. */}
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-charcoal px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <StagingBanner />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
