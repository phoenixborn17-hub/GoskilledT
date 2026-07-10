// Phase D · D1 — leaderboard ranking (DR-034/DR-035). Pure. The ONLY signal is completed-referrals;
// earnings/team-size are not even inputs.
import { describe, it, expect } from "vitest";
import { rankLeaderboard } from "@/modules/affiliate/leaderboard";

describe("rankLeaderboard", () => {
  it("ranks by completedReferrals DESC; ties share a rank (competition ranking 1,1,3,4)", () => {
    const r = rankLeaderboard([
      { userId: "a", displayName: "A", completedReferrals: 2 },
      { userId: "b", displayName: "B", completedReferrals: 5 },
      { userId: "c", displayName: "C", completedReferrals: 5 },
      { userId: "d", displayName: "D", completedReferrals: 1 },
    ]);
    expect(r.map((e) => [e.userId, e.rank])).toEqual([
      ["b", 1],
      ["c", 1],
      ["a", 3],
      ["d", 4],
    ]);
  });

  it("is deterministic on ties (ordered by userId)", () => {
    const r = rankLeaderboard([
      { userId: "z", displayName: null, completedReferrals: 3 },
      { userId: "a", displayName: null, completedReferrals: 3 },
    ]);
    expect(r.map((e) => e.userId)).toEqual(["a", "z"]);
    expect(r.every((e) => e.rank === 1)).toBe(true);
  });

  it("only completions drive order — highest completions first regardless of input order (DR-035)", () => {
    const r = rankLeaderboard([
      { userId: "few", displayName: null, completedReferrals: 1 },
      { userId: "many", displayName: null, completedReferrals: 9 },
    ]);
    expect(r[0].userId).toBe("many");
    expect(r[0].rank).toBe(1);
  });

  it("empty input → empty board (D-29 honest)", () => {
    expect(rankLeaderboard([])).toEqual([]);
  });
});
