// A single held commission credit with its "clears at" time (GPS-M3 §2.2, DR-025 UX rule).
// The remaining time is shown as TEXT (not colour-only) for a11y.
import { formatINR } from "../../lib/money";

function clearsInLabel(holdUntil: Date, now: Date): string {
  const ms = holdUntil.getTime() - now.getTime();
  if (ms <= 0) return "clearing now";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `clears in ~${hours}h`;
  const days = Math.ceil(hours / 24);
  return `clears in ~${days} day${days === 1 ? "" : "s"}`;
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function HeldCreditRow({
  amountInPaise,
  holdUntil,
  now = new Date(),
}: {
  amountInPaise: number;
  holdUntil: Date;
  now?: Date;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="dc-number font-medium tabular-nums text-ink">
        {formatINR(amountInPaise)}
      </span>
      <span className="text-ink-muted">
        {clearsInLabel(holdUntil, now)} · {formatDateTime(holdUntil)}
      </span>
    </li>
  );
}
