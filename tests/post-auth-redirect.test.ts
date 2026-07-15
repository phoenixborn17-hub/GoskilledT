// Phase A (§4.5) — the single post-auth redirect rule + open-redirect guard.
// safeNext is pure; postAuthRedirect's DB branch is covered by the register/login action tests.
import { describe, it, expect } from "vitest";
import { safeNext, safeBannerLink } from "@/lib/auth/post-auth";

describe("safeNext (open-redirect guard)", () => {
  it("honours a same-origin absolute path", () => {
    expect(safeNext("/dashboard/earn")).toBe("/dashboard/earn");
  });

  it("rejects protocol-relative //host escapes", () => {
    expect(safeNext("//evil.com")).toBeNull();
  });

  it("A-4: rejects backslash escapes that browsers normalise to //host", () => {
    expect(safeNext("/\\evil.com")).toBeNull();
    expect(safeNext("/\\/evil.com")).toBeNull();
    expect(safeNext("\\\\evil.com")).toBeNull();
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

// Feature Batch v1.0 §2 — admin promo banner linkUrl guard. No external host is allowlisted yet
// (a founder/business decision, not guessed at) — every external URL is rejected until one is.
describe("safeBannerLink (banner open-redirect guard)", () => {
  it("honours an internal path exactly like safeNext", () => {
    expect(safeBannerLink("/packages")).toBe("/packages");
    expect(safeBannerLink("//evil.com")).toBeNull();
  });

  it("rejects EVERY external URL — the allowlist is currently empty", () => {
    expect(safeBannerLink("https://goskilled.in")).toBeNull();
    expect(safeBannerLink("https://wa.me/911234567890")).toBeNull();
    expect(safeBannerLink("https://evil.example.com")).toBeNull();
  });

  it("rejects a non-https external scheme outright", () => {
    expect(safeBannerLink("http://example.com")).toBeNull();
    expect(safeBannerLink("javascript:alert(1)")).toBeNull();
  });

  it("rejects malformed/unparseable input", () => {
    expect(safeBannerLink("not a url")).toBeNull();
    expect(safeBannerLink(null)).toBeNull();
    expect(safeBannerLink(undefined)).toBeNull();
  });
});
