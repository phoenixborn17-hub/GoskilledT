// Progress ring (Blueprint §3). Pure SVG, no motion — safe for prefers-reduced-motion.
// Gold rule: gold is a fill only; the percentage text sits on the ring center in charcoal.
import { cn } from "../../lib/utils";

export function ProgressRing({
  percent,
  size = 96,
  label,
  className,
}: {
  percent: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={label ?? `${clamped}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#137E4922" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#137E49" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          className="fill-charcoal font-heading text-lg font-bold">{clamped}%</text>
      </svg>
    </div>
  );
}
