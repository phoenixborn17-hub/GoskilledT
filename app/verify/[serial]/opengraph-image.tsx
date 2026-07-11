// GPS-M5 §2.7 — dynamic OG share image for a verified certificate. When a learner shares their
// /verify/<serial> link, social platforms render THIS card (name · course · serial · date) — compliant
// social proof (D-29: no earnings, just a real learning credential). Invalid serial → neutral brand
// fallback (never renders fabricated data).
import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import { getCertificateBySerial } from "../../../lib/lms/certificate";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs"; // certificate lookup uses Prisma

// A-5: throttle per IP, matching the /verify page — the image endpoint is another channel to the
// same certificate lookup (learner name), so it must share the page's anti-enumeration limit.
async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GoSkilled certificate";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function Image({
  params,
}: {
  params: { serial: string };
}) {
  // Over the per-IP limit → skip the lookup and render the neutral fallback (never leak a name).
  const rl = rateLimit(`verify:${await clientIp()}`, {
    max: 20,
    windowMs: 60_000,
  });
  const cert = rl.ok
    ? await getCertificateBySerial(params.serial).catch(() => null)
    : null;

  const GREEN = "#137E49";
  const GOLD = "#EDC825";
  const CHARCOAL = "#2A302A";

  // Satori (next/og) requires display:flex on any element with >1 child, and only Latin glyphs render
  // without a dynamic font fetch — so no special unicode marks here.
  const body = cert?.valid ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 72,
        background: "#FEFEFE",
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
            background: GREEN,
            color: "#fff",
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          G
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 800,
            color: GREEN,
          }}
        >
          GoSkilled
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 3,
            color: "#8a8f88",
          }}
        >
          CERTIFICATE OF COMPLETION
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: CHARCOAL,
            marginTop: 10,
          }}
        >
          {cert.learnerName || "GoSkilled Learner"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: CHARCOAL,
            marginTop: 6,
          }}
        >
          {cert.courseTitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#8a8f88",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex" }}>Serial {params.serial}</div>
          <div style={{ display: "flex" }}>
            {cert.issuedAt ? `Issued ${formatDate(cert.issuedAt)}` : ""}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: GOLD,
            color: CHARCOAL,
            padding: "10px 22px",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Verified credential
        </div>
      </div>
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 72,
        background: GREEN,
        color: "#fff",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
        GoSkilled
      </div>
      <div style={{ display: "flex", fontSize: 30 }}>
        Verify a GoSkilled certificate
      </div>
    </div>
  );

  return new ImageResponse(body, { ...size });
}
