import { describe, it, expect } from "vitest";
import {
  commissionForLevel,
  totalCommission,
  commissionIdempotencyKey,
} from "../modules/affiliate/commission";
import { assertBalanced, balanceOf } from "../modules/ledger/ledger";

describe("commission (DR-007, paise)", () => {
  it("skill-builder levels = ₹900/150/75", () => {
    expect(commissionForLevel("skill-builder", 1)).toBe(90000);
    expect(commissionForLevel("skill-builder", 2)).toBe(15000);
    expect(commissionForLevel("skill-builder", 3)).toBe(7500);
  });
  it("career-booster levels = ₹1250/250/150", () => {
    expect(commissionForLevel("career-booster", 1)).toBe(125000);
    expect(commissionForLevel("career-booster", 2)).toBe(25000);
    expect(commissionForLevel("career-booster", 3)).toBe(15000);
  });
  it("totals", () => {
    expect(totalCommission("skill-builder")).toBe(112500); // ₹1125
    expect(totalCommission("career-booster")).toBe(165000); // ₹1650
  });
  it("idempotency key is stable + unique per (order,upline,level)", () => {
    expect(commissionIdempotencyKey("o1", "u9", 1)).toBe("commission:o1:u9:1");
  });
});

describe("ledger double-entry invariant", () => {
  it("balanced transaction passes", () => {
    expect(() =>
      assertBalanced([
        { amountInPaise: -90000 }, // revenue
        { amountInPaise: 90000 }, // wallet:u9
      ]),
    ).not.toThrow();
  });
  it("unbalanced transaction throws", () => {
    expect(() =>
      assertBalanced([
        { amountInPaise: -90000 }, // revenue
        { amountInPaise: 80000 }, // wallet:u9
      ]),
    ).toThrow(/Unbalanced/);
  });
  it("balance = sum of entries", () => {
    expect(
      balanceOf([{ amountInPaise: 90000 }, { amountInPaise: -50000 }]),
    ).toBe(40000);
  });
});
