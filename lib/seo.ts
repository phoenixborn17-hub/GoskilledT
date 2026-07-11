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

/** Organization structured data (home). Factual only — no income claims (D-29). EDZERA INSPIRING EXCELLENCE LLP. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    description:
      "Practical, job-ready skills in simple Hinglish — honest pricing, no hidden charges, and a 48-hour refund.",
    parentOrganization: {
      "@type": "Organization",
      name: "EDZERA INSPIRING EXCELLENCE LLP",
    },
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Ashish Sangwal" },
  };
}

/** Event structured data for a scheduled webinar (GPS-M4 §2.6). Online, free intro session. D-29
 * clean — describes the session, never promises income. */
export function eventJsonLd(webinar: {
  title: string;
  startsAt: Date;
  joinUrl: string | null;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: webinar.title,
    startDate: webinar.startsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: {
      "@type": "VirtualLocation",
      url: webinar.joinUrl || `${siteUrl()}/webinar`,
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    description:
      "Free introduction webinar — what GoSkilled is, the learning roadmap, and how to get started.",
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
