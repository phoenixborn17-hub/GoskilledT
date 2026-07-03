import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl, SITE_NAME } from "../lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — Learn in-demand skills`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "Practical, job-ready skills in Hinglish — learn at your own pace.", // D-29: no income claims/guarantees
};

// Mobile-first: design from 320px up (DESIGN_DIRECTION.md).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#137E49",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-offwhite font-body text-charcoal antialiased">{children}</body>
    </html>
  );
}
