// SEO helpers (Ticket 5). Central site URL + a small metadata builder for canonical + OG.
import type { Metadata } from "next";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const SITE_NAME = "GoSkilled";

/** Per-page metadata with canonical + OpenGraph. `path` is the canonical path (e.g. "/courses"). */
export function pageMetadata(opts: { title: string; description: string; path: string }): Metadata {
  const url = `${siteUrl()}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}
