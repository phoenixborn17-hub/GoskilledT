import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoSkilled",
  description: "Learn in-demand skills.", // D-29: no income claims/guarantees in copy
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
