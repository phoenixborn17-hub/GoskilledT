// Branded default OG image (next/og) — one template applied across all public pages that don't
// define their own. Sora display font with graceful fallback + brand green gradient. Gold is used
// only as a small accent bar (Golden Rule 14: gold is never text).
import { ImageResponse } from "next/og";
import { SITE_NAME } from "../lib/seo";

export const alt = "GoSkilled — practical, job-ready skills in Hinglish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fetch the Sora display font for the OG canvas; returns null on any failure so the image still
// renders with the default font (never breaks the build or the request).
async function loadSora(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Sora:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [bold, extra] = await Promise.all([loadSora(700), loadSora(800)]);
  const fonts = [
    bold && { name: "Sora", data: bold, weight: 700 as const, style: "normal" as const },
    extra && { name: "Sora", data: extra, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 800; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0C5A34 0%, #137E49 55%, #1AA05E 100%)",
          color: "#FEFEFE",
          fontFamily: fonts.length ? "Sora" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "40px", height: "8px", borderRadius: "9999px", background: "#EDC825" }} />
          <span style={{ fontSize: "34px", fontWeight: 700 }}>{SITE_NAME}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "108px", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-2px" }}>
            Seekho. Badho. Kamao.
          </span>
          <span style={{ marginTop: "28px", fontSize: "36px", fontWeight: 700, color: "rgba(254,254,254,0.85)" }}>
            Practical, job-ready skills in simple Hinglish.
          </span>
        </div>

        <span style={{ fontSize: "26px", fontWeight: 700, color: "rgba(254,254,254,0.8)" }}>
          GST-inclusive pricing · 48-hour refund · We sell skills, not dreams
        </span>
      </div>
    ),
    { ...size, fonts },
  );
}
