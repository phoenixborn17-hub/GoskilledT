import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/seo";
import { publishedCourseSlugs } from "../lib/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = [
    "",
    "/courses",
    "/packages",
    "/about",
    "/faq",
    "/contact",
    "/webinar",
    "/earn",
    "/blog",
    "/videos",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/disclaimer",
  ];
  const slugs = await publishedCourseSlugs();

  return [
    ...staticPaths.map((p) => ({
      url: `${base}${p || "/"}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...slugs.map((s) => ({
      url: `${base}/courses/${s}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
