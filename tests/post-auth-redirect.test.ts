// Phase A (§4.5) — the single post-auth redirect rule + open-redirect guard.
// safeNext is pure; postAuthRedirect's DB branch is covered by the register/login action tests.
import { describe, it, expect } from "vitest";
import { safeNext } from "@/lib/auth/post-auth";

describe("safeNext (open-redirect guard)", () => {
  it("honours a same-origin absolute path", () => {
    expect(safeNext("/dashboard/earn")).toBe("/dashboard/earn");
  });

  it("rejects protocol-relative //host escapes", () => {
    expect(safeNext("//evil.com")).toBeNull();
  });

  it("rejects absolute URLs and non-rooted paths", () => {
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("dashboard")).toBeNull();
  });

  it("treats empty/absent as no next", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext("")).toBeNull();
  });
});
