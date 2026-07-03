// SEO helpers (Ticket 5). Central site URL + a small metadata builder for canonical + OG.
import type { Metadata } from "next";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export const SITE_NAME = "GoSkilled";

/** Per-page metadata with canonical + OpenGraph. `path` is the canonical path (e.g. "/courses"). */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
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
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}

/** Organization structured data (home). Factual only — no income claims (D-29). EDZERA LLP per 1B. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    description:
      "Practical, job-ready skills in simple Hinglish — honest, GST-inclusive pricing and a 48-hour refund.",
    parentOrganization: { "@type": "Organization", name: "EDZERA LLP" },
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Ashish Sangwal" },
  };
}

/** FAQPage structured data from the shared FAQ copy. */
export function faqPageJsonLd(
  items: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
