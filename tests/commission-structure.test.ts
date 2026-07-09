// Phase B / B5 — the commission-structure page renders the DR-007 numbers from the single source of
// truth (modules/affiliate/commission), never re-typed. Pure.
import { describe, it, expect } from "vitest";
import { commissionStructure } from "@/lib/affiliate/commission-structure";

describe("commissionStructure (DR-007)", () => {
  it("Skill Builder = ₹900 / 150 / 75 (paise), total ₹1125", () => {
    const sb = commissionStructure().find((r) => r.slug === "skill-builder")!;
    expect(sb.levels.map((l) => l.amountInPaise)).toEqual([90000, 15000, 7500]);
    expect(sb.totalInPaise).toBe(112500);
  });

  it("Career Booster = ₹1250 / 250 / 150 (paise), total ₹1650", () => {
    const cb = commissionStructure().find((r) => r.slug === "career-booster")!;
    expect(cb.levels.map((l) => l.amountInPaise)).toEqual([
      125000, 25000, 15000,
    ]);
    expect(cb.totalInPaise).toBe(165000);
  });

  it("levels are labelled 1/2/3 in order", () => {
    for (const row of commissionStructure())
      expect(row.levels.map((l) => l.level)).toEqual([1, 2, 3]);
  });
});
