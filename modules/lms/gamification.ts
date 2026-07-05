// GPS-M5 §2.3 — ethical gamification. PURE + derived (no new tables): streaks + milestones are computed
// from real activity (LessonProgress / quiz passes / certificates). ETHICAL RULES, enforced here:
//   • ZERO loss-aversion — a gap makes a streak REST, never "break"/"lost". No "you'll lose it", no FOMO.
//   • Milestones celebrate REAL achievements only (D-29: learning wins, never earnings/income).
//   • A new/idle account gets a warm INVITE, never a guilt nudge.

/** A learning day = a calendar day (IST) with ≥1 real activity. Dates are 'YYYY-MM-DD' strings. */
export type StreakState = "active" | "resting";

export interface StreakView {
  current: number; // length of the run ending today (active) or yesterday (resting)
  longest: number;
  state: StreakState;
}

function addDays(dateStr: string, delta: number): string {
  // Treat the string as a plain calendar date (already IST-normalized). Noon UTC avoids DST/TZ edges.
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * PURE: compute the streak from the set of active days. The run is anchored at today (active) or, if
 * today has no activity yet, at yesterday (resting) — so a learner is NEVER punished for not having
 * studied *yet today*. A longer gap → current 0, resting (the UI shows a warm invite, not a loss).
 */
export function computeStreak(activeDays: string[], today: string): StreakView {
  const set = new Set(activeDays);
  const longest = longestRun(activeDays);

  let anchor: string | null = null;
  let state: StreakState = "resting";
  if (set.has(today)) {
    anchor = today;
    state = "active";
  } else if (set.has(addDays(today, -1))) {
    anchor = addDays(today, -1);
    state = "resting"; // studied yesterday, not yet today — resting, not broken
  }

  let current = 0;
  if (anchor) {
    let day = anchor;
    while (set.has(day)) {
      current++;
      day = addDays(day, -1);
    }
  }
  return { current, longest, state };
}

function longestRun(activeDays: string[]): number {
  const sorted = [...new Set(activeDays)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

// ── Milestones (real achievements only) ─────────────────────────────────────────────────────────
export type MilestoneId =
  | "first_lesson"
  | "quiz_first"
  | "halfway"
  | "course_complete"
  | "certificate"
  | "streak_3"
  | "streak_7";

export interface Milestone {
  id: MilestoneId;
  label: string; // warm, D-29-safe learning achievement
  achieved: boolean;
}

export interface MilestoneInput {
  anyLessonDone: boolean;
  anyQuizPassed: boolean;
  maxCoursePercent: number; // highest completion across enrolled courses
  certificateCount: number;
  longestStreak: number;
}

/** PURE: the ordered milestone set with achieved flags (real events only — never fabricated). */
export function computeMilestones(i: MilestoneInput): Milestone[] {
  return [
    {
      id: "first_lesson",
      label: "Pehla lesson complete",
      achieved: i.anyLessonDone,
    },
    { id: "quiz_first", label: "Pehla quiz pass", achieved: i.anyQuizPassed },
    {
      id: "halfway",
      label: "Aadha course complete",
      achieved: i.maxCoursePercent >= 50,
    },
    {
      id: "course_complete",
      label: "Poora course complete",
      achieved: i.maxCoursePercent >= 100,
    },
    {
      id: "certificate",
      label: "Certificate earned",
      achieved: i.certificateCount > 0,
    },
    {
      id: "streak_3",
      label: "3-din learning streak",
      achieved: i.longestStreak >= 3,
    },
    {
      id: "streak_7",
      label: "7-din learning streak",
      achieved: i.longestStreak >= 7,
    },
  ];
}

/** The next un-earned milestone — shown as a POSITIVE goal, never as pressure. Null when all earned. */
export function nextMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find((m) => !m.achieved) ?? null;
}
