// DR-030 §6.2 — checklistState JSON is validated on read (Golden Rule 4). Junk must never crash the
// Hub; only the dismissal timestamp is persisted (derived progress is never stored). Pure, no DB.
import { describe, it, expect } from "vitest";
import { parseChecklistState } from "@/lib/dashboard/hub";

describe("parseChecklistState", () => {
  it("returns an empty object for null/undefined (fresh user)", () => {
    expect(parseChecklistState(null)).toEqual({});
    expect(parseChecklistState(undefined)).toEqual({});
  });

  it("keeps a valid dismissedAt", () => {
    const iso = "2026-07-04T10:00:00.000Z";
    expect(parseChecklistState({ dismissedAt: iso })).toEqual({
      dismissedAt: iso,
    });
  });

  it("coerces malformed shapes to a safe empty object", () => {
    expect(parseChecklistState({ dismissedAt: 123 })).toEqual({});
    expect(parseChecklistState("garbage")).toEqual({});
    expect(parseChecklistState([1, 2, 3])).toEqual({});
  });

  it("ignores unknown keys, retaining only dismissedAt", () => {
    const parsed = parseChecklistState({
      dismissedAt: "2026-07-04T00:00:00.000Z",
      doneSeen: ["lesson0"],
      injected: true,
    });
    expect(parsed).toEqual({ dismissedAt: "2026-07-04T00:00:00.000Z" });
  });
});
