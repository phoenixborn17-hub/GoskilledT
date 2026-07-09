// Dependency-light SVG chart (Phase B / B2 · B4). No charting library — a small, accessible,
// theme-aware bar/line chart consistent with the repo's hand-rolled SVG style (cf. progress-ring).
// Gold is a FILL with charcoal labels (never gold text on light — contrast rule). Honest empty
// state (D-29: no fabricated bars). Server component — no client JS. Values are unit-agnostic;
// `format` renders the tooltip/label text.
import type { SeriesPoint } from "../../lib/affiliate/analytics";

export function MiniChart({
  points,
  kind = "bar",
  format = (n) => String(n),
  empty = "No data yet.",
  height = 120,
}: {
  points: SeriesPoint[];
  kind?: "bar" | "line";
  format?: (n: number) => string;
  empty?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="rounded-xl bg-charcoal/5 p-4 text-sm text-muted">{empty}</p>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const W = 320;
  const H = height;
  const pad = 6;
  const innerH = H - pad * 2;
  const n = points.length;
  const step = W / n;
  const barW = Math.max(2, Math.min(28, step * 0.6));

  const summary = points
    .map((p) => `${p.label}: ${format(p.value)}`)
    .join(", ");

  const y = (v: number) => pad + innerH * (1 - v / max);

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        role="img"
        aria-label={summary}
        className="overflow-visible"
      >
        {/* baseline */}
        <line
          x1="0"
          y1={H - pad}
          x2={W}
          y2={H - pad}
          className="stroke-charcoal/15"
          strokeWidth="1"
        />
        {kind === "line" ? (
          <polyline
            fill="none"
            className="stroke-gold"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points
              .map((p, i) => `${step * i + step / 2},${y(p.value)}`)
              .join(" ")}
          />
        ) : (
          points.map((p, i) => {
            const h = (p.value / max) * innerH;
            return (
              <rect
                key={p.key}
                x={step * i + (step - barW) / 2}
                y={H - pad - h}
                width={barW}
                height={Math.max(0, h)}
                rx="2"
                className="fill-gold"
              >
                <title>{`${p.label}: ${format(p.value)}`}</title>
              </rect>
            );
          })
        )}
      </svg>
      {/* first / last axis labels — keep it uncluttered on mobile */}
      <div className="flex justify-between text-[11px] text-muted">
        <span>{points[0].label}</span>
        {n > 1 && <span>{points[n - 1].label}</span>}
      </div>
      {/* Screen-reader data table (the chart is decorative for AT; data lives here). */}
      <table className="sr-only">
        <caption>Chart data</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
