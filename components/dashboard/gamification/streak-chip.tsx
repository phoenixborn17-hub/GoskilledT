// GPS-M5 §2.3 — streak chip (Register 1, hub). Ethical: celebrates the run, invites warmly when
// resting, and NEVER warns about losing anything. No countdown, no FOMO. Server component.
import { Flame } from "lucide-react";
import type { StreakView } from "../../../modules/lms/gamification";

export function StreakChip({ streak }: { streak: StreakView }) {
  const active = streak.state === "active" && streak.current > 0;
  const resting = streak.current > 0 && !active;

  const { title, sub, tone } = active
    ? {
        title: `${streak.current} din ki learning streak!`,
        sub: "Aaj bhi seekha — shabaash. Aise hi chalte raho.",
        tone: "brand" as const,
      }
    : resting
      ? {
          title: "Streak resting hai",
          sub: "Aaj ek chhota lesson se wapas shuru karo — bas 2 minute.",
          tone: "muted" as const,
        }
      : {
          title: "Apni learning streak shuru karo",
          sub: "Ek lesson complete karo — aaj se rozana thoda seekho.",
          tone: "muted" as const,
        };

  return (
    <div
      className={
        "flex items-center gap-3 rounded-gs-lg border p-4 " +
        (tone === "brand"
          ? "border-brand/20 bg-brand/5"
          : "border-line/10 bg-surface-raised")
      }
    >
      <span
        className={
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full " +
          (active ? "bg-gold/20 text-ink" : "bg-charcoal/5 text-muted")
        }
        aria-hidden
      >
        <Flame className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      {streak.longest > 1 && (
        <span className="shrink-0 text-right text-[11px] text-muted">
          Best
          <br />
          <span className="font-bold text-ink">{streak.longest} din</span>
        </span>
      )}
    </div>
  );
}
