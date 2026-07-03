// Ticket 4, Task 5 — pure LMS progress/resume/access logic. No DB.
import { describe, it, expect } from "vitest";
import {
  courseProgress,
  resumeLessonId,
  nextLessonId,
  canAccessLesson,
} from "../modules/lms/progress";

const lessons = ["l1", "l2", "l3", "l4"];

describe("courseProgress", () => {
  it("empty course → 0/0/0", () => {
    expect(courseProgress([], [])).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });
  it("no progress → 0%", () => {
    expect(courseProgress(lessons, [])).toEqual({
      completed: 0,
      total: 4,
      percent: 0,
    });
  });
  it("partial → rounded percent", () => {
    expect(courseProgress(lessons, ["l1"])).toEqual({
      completed: 1,
      total: 4,
      percent: 25,
    });
    expect(courseProgress(["a", "b", "c"], ["a"])).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
    });
  });
  it("all done → 100%", () => {
    expect(courseProgress(lessons, lessons)).toEqual({
      completed: 4,
      total: 4,
      percent: 100,
    });
  });
  it("ignores completed ids not in the course", () => {
    expect(courseProgress(lessons, ["l1", "ghost"]).completed).toBe(1);
  });
});

describe("resumeLessonId", () => {
  it("no progress → first lesson (Start)", () =>
    expect(resumeLessonId(lessons, [])).toBe("l1"));
  it("some progress → first incomplete (Resume)", () =>
    expect(resumeLessonId(lessons, ["l1", "l2"])).toBe("l3"));
  it("gap → first incomplete, not after last-completed", () =>
    expect(resumeLessonId(lessons, ["l2"])).toBe("l1"));
  it("all done → null (complete)", () =>
    expect(resumeLessonId(lessons, lessons)).toBeNull());
});

describe("nextLessonId", () => {
  it("returns the following lesson", () =>
    expect(nextLessonId(lessons, "l2")).toBe("l3"));
  it("last lesson → null", () =>
    expect(nextLessonId(lessons, "l4")).toBeNull());
  it("unknown lesson → null", () =>
    expect(nextLessonId(lessons, "zzz")).toBeNull());
});

describe("canAccessLesson (server-side gate)", () => {
  it("enrolled → always", () => {
    expect(
      canAccessLesson({ isFreePreview: false }, { isEnrolled: true }),
    ).toBe(true);
    expect(canAccessLesson({ isFreePreview: true }, { isEnrolled: true })).toBe(
      true,
    );
  });
  it("not enrolled → only free preview", () => {
    expect(
      canAccessLesson({ isFreePreview: true }, { isEnrolled: false }),
    ).toBe(true);
    expect(
      canAccessLesson({ isFreePreview: false }, { isEnrolled: false }),
    ).toBe(false);
  });
});
