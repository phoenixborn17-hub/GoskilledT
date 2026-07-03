// Ticket 5, Task 6 — pure catalog display-shaping. No DB.
import { describe, it, expect } from "vitest";
import {
  formatDuration, courseStats, priceLabel, packageComparison, packagesIncludingCourse, courseCategories,
} from "../lib/catalog/shape";

describe("formatDuration", () => {
  it("minutes under an hour", () => {
    expect(formatDuration(300)).toBe("5 min");
    expect(formatDuration(90)).toBe("2 min"); // rounds
  });
  it("whole and partial hours", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(4500)).toBe("1h 15m");
  });
});

describe("courseStats", () => {
  it("aggregates lessons, duration, preview flag", () => {
    const modules = [
      { lessons: [{ durationSec: 300, isFreePreview: true }, { durationSec: 420, isFreePreview: false }] },
      { lessons: [{ durationSec: 480, isFreePreview: false }] },
    ];
    expect(courseStats(modules)).toEqual({ lessonCount: 3, totalDurationSec: 1200, durationLabel: "20 min", hasFreePreview: true });
  });
  it("empty course", () => {
    expect(courseStats([])).toEqual({ lessonCount: 0, totalDurationSec: 0, durationLabel: "0 min", hasFreePreview: false });
  });
});

describe("priceLabel (GST-inclusive, whole rupees)", () => {
  it("formats whole rupees without decimals", () => {
    expect(priceLabel(149900)).toBe("₹1,499");
    expect(priceLabel(219900)).toBe("₹2,199");
  });
});

describe("packageComparison", () => {
  const sb = { slug: "skill-builder", name: "Skill Builder", priceInPaise: 149900, includesFutureCourses: false };
  const cb = { slug: "career-booster", name: "Career Booster", priceInPaise: 219900, includesFutureCourses: true };
  const rows = packageComparison(sb, cb);
  it("has all comparison rows with correct prices", () => {
    expect(rows).toHaveLength(6);
    const price = rows.find((r) => r.feature.startsWith("Price"))!;
    expect(price.skillBuilder).toBe("₹1,499");
    expect(price.careerBooster).toBe("₹2,199");
  });
  it("DR-021 composition: SB = 1 of choice, CB = both + future", () => {
    expect(rows[0]).toMatchObject({ feature: "Launch courses", skillBuilder: "1 course of your choice", careerBooster: "Both launch courses" });
    expect(rows[1]).toMatchObject({ feature: "Future courses", skillBuilder: "Not included", careerBooster: "Included as released", highlight: true });
  });
});

describe("packagesIncludingCourse", () => {
  const packages = [
    { name: "Skill Builder", courseSlugs: ["ai-prompt-mastery", "digital-marketing"] },
    { name: "Career Booster", courseSlugs: ["ai-prompt-mastery", "digital-marketing"] },
  ];
  it("lists packages that include a course", () => {
    expect(packagesIncludingCourse("ai-prompt-mastery", packages)).toEqual(["Skill Builder", "Career Booster"]);
    expect(packagesIncludingCourse("unknown", packages)).toEqual([]);
  });
});

describe("courseCategories", () => {
  it("distinct, sorted, non-null", () => {
    expect(courseCategories([{ category: "Marketing" }, { category: "AI" }, { category: "AI" }, { category: null }])).toEqual(["AI", "Marketing"]);
  });
});
