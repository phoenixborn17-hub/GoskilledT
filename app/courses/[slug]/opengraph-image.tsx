// Phase 6 · dynamic OG share image for a course page. When a learner or affiliate shares a
// /courses/<slug> link on WhatsApp, social platforms render THIS card (title · category · what's
// inside) instead of the generic site card — a stronger, on-brand preview. D-29 clean: describes
// the course only, never promises income or outcomes. Unknown/system slug → neutral brand fallback
// (never renders fabricated data). Mirrors the certificate OG pattern (/verify/[serial]).
import { ImageResponse } from "next/og";
import { getCourseDetail } from "../../../lib/catalog/queries";
import { courseStats } from "../../../lib/catalog/shape";
import { loadSoraFonts } from "../../../lib/og/fonts";
import { SITE_NAME } from "../../../lib/seo";

export const runtime = "nodejs"; // course lookup uses Prisma
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GoSkilled course";

const GREEN = "#137E49";
const GOLD = "#EDC825";

export default async function Image({ params }: { params: { slug: string } }) {
  const [course, fonts] = await Promise.all([
    getCourseDetail(params.slug).catch(() => null),
    loadSoraFonts([400, 700, 800]),
  ]);
  const family = fonts.length ? "Sora" : "sans-serif";

  // Neutral brand fallback for an unknown slug (Satori needs display:flex on multi-child nodes).
  if (!course) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 72,
          background:
            "linear-gradient(135deg, #0C5A34 0%, #137E49 55%, #1AA05E 100%)",
          color: "#FEFEFE",
          justifyContent: "center",
          gap: 16,
          fontFamily: family,
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 32 }}>
          Practical, job-ready skills in simple Hinglish.
        </div>
      </div>,
      { ...size, fonts },
    );
  }

  const comingSoon = course.status === "COMING_SOON";
  const stats = courseStats(course.modules);
  // Honest, factual meta line — only render facts we actually have.
  const facts = [
    course.modules.length > 0 ? `${course.modules.length} modules` : null,
    stats.lessonCount > 0 ? `${stats.lessonCount} lessons` : null,
    stats.totalDurationSec > 0 ? stats.durationLabel : null,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 72,
        background: "#FEFEFE",
        justifyContent: "space-between",
        fontFamily: family,
      }}
    >
      {/* Brand row + optional category pill */}
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
            {SITE_NAME}
          </div>
        </div>
        {course.category ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#EAF5EE",
              color: GREEN,
              padding: "10px 22px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {course.category}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
      </div>

      {/* Title + summary */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 3,
            color: "#8a8f88",
            fontWeight: 700,
          }}
        >
          {comingSoon ? "COMING SOON" : "COURSE"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#2A302A",
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          {course.title}
        </div>
        {course.summary ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#5b615a",
              marginTop: 18,
              lineHeight: 1.3,
            }}
          >
            {course.summary.length > 120
              ? `${course.summary.slice(0, 117)}…`
              : course.summary}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
      </div>

      {/* Fact row + trust accent (gold as an accent bar only — Golden Rule 14) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 8,
              borderRadius: 9999,
              background: GOLD,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", fontSize: 26, color: "#5b615a" }}>
            {facts.length ? facts.join("  ·  ") : "Learn in simple Hinglish"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            color: "#8a8f88",
          }}
        >
          No hidden charges · 48-hour refund
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
