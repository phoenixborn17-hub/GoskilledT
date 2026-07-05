// GPS-M5 §2.5 — PWA manifest (Next auto-injects <link rel="manifest">). Installable app shell.
// Icons are a placeholder brand mark (LC — final = founder logo asset).
import type { MetadataRoute } from "next";
import { SITE_NAME } from "../lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Seekho. Badho.`,
    short_name: SITE_NAME,
    description:
      "Practical, job-ready skills in Hinglish — learn at your own pace.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FEFEFE",
    theme_color: "#137E49",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
