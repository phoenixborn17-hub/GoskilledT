// Branded default OG image (next/og) — one template applied across all public pages that don't
// define their own. Sora display font with graceful fallback + brand green gradient. Gold is used
// only as a small accent bar (Golden Rule 14: gold is never text).
import { ImageResponse } from "next/og";
import { SITE_NAME } from "../lib/seo";
import { loadSoraFonts } from "../lib/og/fonts";

export const alt = "GoSkilled — practical, job-ready skills in Hinglish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const fonts = await loadSoraFonts([700, 800]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background:
          "linear-gradient(135deg, #0C5A34 0%, #137E49 55%, #1AA05E 100%)",
        color: "#FEFEFE",
        fontFamily: fonts.length ? "Sora" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "8px",
            borderRadius: "9999px",
            background: "#EDC825",
          }}
        />
        <span style={{ fontSize: "34px", fontWeight: 700 }}>{SITE_NAME}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: "108px",
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: "-2px",
          }}
        >
          {/* Approved D-29 exception: brand tagline only, no income claim (see app/page.tsx). */}
          Seekho. Badho. Kamao.
        </span>
        <span
          style={{
            marginTop: "28px",
            fontSize: "36px",
            fontWeight: 700,
            color: "rgba(254,254,254,0.85)",
          }}
        >
          Practical, job-ready skills in simple Hinglish.
        </span>
      </div>

      <span
        style={{
          fontSize: "26px",
          fontWeight: 700,
          color: "rgba(254,254,254,0.8)",
        }}
      >
        No hidden charges · 48-hour refund · We sell skills, not dreams
      </span>
    </div>,
    { ...size, fonts },
  );
}
