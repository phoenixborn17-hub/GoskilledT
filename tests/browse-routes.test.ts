// Slice 5 (journey-break fix) — pure route/slug guards.
// 1) Focus-mode detection: ONLY /dashboard/learn/<courseSlug> is a player route; the in-app
//    Browse + Webinars pages share the prefix but keep normal workspace chrome.
// 2) Reserved course slugs: "browse"/"webinars" collide with app routes and must never publish.
import { describe, it, expect } from "vitest";
import { isPlayerFocusRoute } from "../lib/nav/focus-mode";
import {
  RESERVED_COURSE_SLUGS,
  isReservedCourseSlug,
  reservedSlugError,
} from "../lib/catalog/reserved-slugs";

describe("isPlayerFocusRoute (focus-mode chrome)", () => {
  it("matches a course-player route", () => {
    expect(isPlayerFocusRoute("/dashboard/learn/digital-marketing")).toBe(true);
    expect(isPlayerFocusRoute("/dashboard/learn/ai-prompt-mastery")).toBe(true);
  });

  it("does NOT match the in-app browse index or detail", () => {
    expect(isPlayerFocusRoute("/dashboard/learn/browse")).toBe(false);
    expect(isPlayerFocusRoute("/dashboard/learn/browse/")).toBe(false);
    expect(
      isPlayerFocusRoute("/dashboard/learn/browse/digital-marketing"),
    ).toBe(false);
  });

  it("does NOT match the in-app webinars page", () => {
    expect(isPlayerFocusRoute("/dashboard/learn/webinars")).toBe(false);
  });

  it("does NOT match the Learn dashboard, deeper paths, or other workspaces", () => {
    expect(isPlayerFocusRoute("/dashboard/learn")).toBe(false);
    expect(isPlayerFocusRoute("/dashboard/learn/slug/extra")).toBe(false);
    expect(isPlayerFocusRoute("/dashboard/home")).toBe(false);
    expect(isPlayerFocusRoute("/dashboard/earn/wallet")).toBe(false);
  });

  it("still treats a course slug that merely STARTS with a reserved word as a player route", () => {
    expect(isPlayerFocusRoute("/dashboard/learn/browser-basics")).toBe(true);
    expect(isPlayerFocusRoute("/dashboard/learn/webinars-101")).toBe(true);
  });
});

describe("reserved course slugs (publish guard)", () => {
  it("reserves exactly the static learn segments", () => {
    expect(RESERVED_COURSE_SLUGS).toContain("browse");
    expect(RESERVED_COURSE_SLUGS).toContain("webinars");
  });

  it("flags reserved slugs case-insensitively", () => {
    expect(isReservedCourseSlug("browse")).toBe(true);
    expect(isReservedCourseSlug("Browse")).toBe(true);
    expect(isReservedCourseSlug("WEBINARS")).toBe(true);
  });

  it("allows real course slugs", () => {
    expect(isReservedCourseSlug("digital-marketing")).toBe(false);
    expect(isReservedCourseSlug("browser-basics")).toBe(false);
  });

  it("produces an actionable error message", () => {
    expect(reservedSlugError("browse")).toMatch(/reserved/);
    expect(reservedSlugError("browse")).toMatch(/\/dashboard\/learn\/browse/);
  });
});
