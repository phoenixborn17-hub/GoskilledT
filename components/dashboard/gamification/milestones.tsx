// GPS-M5 §2.3 — milestones (Register 1, progress page). Celebrates REAL learning achievements only
// (D-29: zero earnings framing). Earned = filled; the next one is a POSITIVE goal, never pressure.
// A new account sees an inviting first goal, not a wall of locked badges. Server component.
import {
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
  Award,
  Flame,
  Target,
} from "lucide-react";
import { Card } from "../../ui/card";
import type { Milestone, MilestoneId } from "../../../modules/lms/gamification";

const ICON: Record<MilestoneId, typeof Award> = {
  first_lesson: PlayCircle,
  quiz_first: CheckCircle2,
  halfway: TrendingUp,
  course_complete: GraduationCap,
  certificate: Award,
  streak_3: Flame,
  streak_7: Flame,
};

export function Milestones({
  milestones,
  next,
  earnedCount,
}: {
  milestones: Milestone[];
  next: Milestone | null;
  earnedCount: number;
}) {
  const earned = milestones.filter((m) => m.achieved);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-ink">
          Milestones
        </h2>
        {earnedCount > 0 && (
          <span className="text-sm font-semibold text-brand">
            {earnedCount} earned
          </span>
        )}
      </div>

      {earned.length === 0 ? (
        // Warm first-goal invite — no fake wins, no pressure.
        <div className="flex items-center gap-3 rounded-xl bg-brand/5 p-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"
            aria-hidden
          >
            <Target className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink">
            Aapka pehla milestone:{" "}
            <span className="font-semibold">{next?.label}</span>. Bas ek lesson
            se shuruaat karo!
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {earned.map((m) => {
              const Icon = ICON[m.id];
              return (
                <li
                  key={m.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-ink"
                >
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  {m.label}
                </li>
              );
            })}
          </ul>
          {next && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Target className="h-4 w-4 text-brand" aria-hidden />
              Next goal:{" "}
              <span className="font-medium text-ink">{next.label}</span>
            </p>
          )}
        </>
      )}
    </Card>
  );
}
