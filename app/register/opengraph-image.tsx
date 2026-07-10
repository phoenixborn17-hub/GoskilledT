// Phase 6 · OG share card for the invite landing (/register). When someone shares their GoSkilled
// invite link, this is the WhatsApp/social preview: a warm "you're invited" card that matches the
// page's own copy (DR-036 invite-only). COMPLIANCE-SAFE by design — it carries NO referrer identity
// (no PII/attribution — that personalization is Phase 7 / DR-040) and NO income claim (D-29): it
// only says "invited to learn". Gold is an accent bar only (Golden Rule 14).
import { ImageResponse } from "next/og";
import { loadSoraFonts } from "../../lib/og/fonts";
import { SITE_NAME } from "../../lib/seo";

export const alt = "You're invited to GoSkilled";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fonts = await loadSoraFonts([400, 700, 800]);
  const family = fonts.length ? "Sora" : "sans-serif";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 72,
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, #0C5A34 0%, #137E49 55%, #1AA05E 100%)",
        color: "#FEFEFE",
        fontFamily: family,
      }}
    >
      {/* Brand row + invite pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#FEFEFE",
              color: "#137E49",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#EDC825",
            color: "#2A302A",
            padding: "10px 22px",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Invite-only
        </div>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.03,
            letterSpacing: "-1.5px",
          }}
        >
          You&apos;re invited to GoSkilled
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 34,
            fontWeight: 700,
            color: "rgba(254,254,254,0.85)",
          }}
        >
          Practical, job-ready skills in simple Hinglish — learn at your own
          pace.
        </div>
      </div>

      {/* Trust line with gold accent bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 8,
            borderRadius: 9999,
            background: "#EDC825",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: "rgba(254,254,254,0.8)",
          }}
        >
          No hidden charges · 48-hour refund · We sell skills, not dreams
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
