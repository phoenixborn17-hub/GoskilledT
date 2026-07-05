// GPS-M5 §2.3 — ethical gamification (pure). The ETHICAL rules are the point: a gap RESTS a streak
// (never breaks it), and a longer gap yields a warm zero, never a punishment.
import { describe, it, expect } from "vitest";
import {
  computeStreak,
  computeMilestones,
  nextMilestone,
} from "../modules/lms/gamification";

const TODAY = "2026-07-05";
const day = (delta: number) => {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

describe("computeStreak (ethical)", () => {
  it("counts an active run ending today", () => {
    const s = computeStreak([day(-2), day(-1), day(0)], TODAY);
    expect(s).toEqual({ current: 3, longest: 3, state: "active" });
  });

  it("RESTS (not breaks) when studied yesterday but not yet today", () => {
    const s = computeStreak([day(-2), day(-1)], TODAY);
    expect(s.state).toBe("resting");
    expect(s.current).toBe(2); // the run is honoured, not zeroed
  });

  it("returns a warm zero after a longer gap — never negative, never 'broken'", () => {
    const s = computeStreak([day(-5), day(-4)], TODAY);
    expect(s).toMatchObject({ current: 0, state: "resting" });
    expect(s.longest).toBe(2); // history still celebrated
  });

  it("handles an empty history (new account) as a resting zero", () => {
    expect(computeStreak([], TODAY)).toEqual({
      current: 0,
      longest: 0,
      state: "resting",
    });
  });

  it("computes the longest run across gaps + ignores duplicate days", () => {
    const s = computeStreak(
      [day(-10), day(-9), day(-9), day(-1), day(0)],
      TODAY,
    );
    expect(s.longest).toBe(2);
    expect(s.current).toBe(2);
  });
});

describe("computeMilestones (real events only)", () => {
  it("reflects real achievements and nothing fabricated", () => {
    const ms = computeMilestones({
      anyLessonDone: true,
      anyQuizPassed: false,
      maxCoursePercent: 60,
      certificateCount: 0,
      longestStreak: 4,
    });
    const by = Object.fromEntries(ms.map((m) => [m.id, m.achieved]));
    expect(by).toMatchObject({
      first_lesson: true,
      quiz_first: false,
      halfway: true,
      course_complete: false,
      certificate: false,
      streak_3: true,
      streak_7: false,
    });
  });

  it("a brand-new account has zero milestones (no fake wins)", () => {
    const ms = computeMilestones({
      anyLessonDone: false,
      anyQuizPassed: false,
      maxCoursePercent: 0,
      certificateCount: 0,
      longestStreak: 0,
    });
    expect(ms.every((m) => !m.achieved)).toBe(true);
    expect(nextMilestone(ms)?.id).toBe("first_lesson"); // a positive first goal, not pressure
  });
});
