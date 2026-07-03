import type { Metadata, Viewport } from "next";
import { Sora, Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { siteUrl, SITE_NAME } from "../lib/seo";

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
    >
      <body className="min-h-dvh bg-offwhite font-body text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
