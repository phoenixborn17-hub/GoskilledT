// Ticket 6, Task 4 — pure lead-shaping + UTM extraction. No DB.
import { describe, it, expect } from "vitest";
import { buildLeadData, extractUtm } from "../modules/crm/lead";

describe("buildLeadData", () => {
  it("canonicalizes phone to +91 and maps fields", () => {
    const d = buildLeadData({
      name: "  Asha  ",
      phone: "9876543210",
      source: "webinar",
      stage: "WEBINAR_REGISTERED",
      utm: { source: "insta", medium: "reel", campaign: "launch" },
      packageInterest: " career-booster ",
    });
    expect(d).toEqual({
      phone: "+919876543210",
      source: "webinar",
      name: "Asha",
      stage: "WEBINAR_REGISTERED",
      utmSource: "insta",
      utmMedium: "reel",
      utmCampaign: "launch",
      packageInterest: "career-booster",
    });
  });

  it("empty/missing optionals become null", () => {
    const d = buildLeadData({ phone: "9000000001", source: "earn-waitlist", stage: "NEW" });
    expect(d.name).toBeNull();
    expect(d.utmSource).toBeNull();
    expect(d.utmMedium).toBeNull();
    expect(d.utmCampaign).toBeNull();
    expect(d.packageInterest).toBeNull();
    expect(d.phone).toBe("+919000000001");
  });
});

describe("extractUtm", () => {
  it("extracts the three UTM params", () => {
    expect(extractUtm({ utm_source: "google", utm_medium: "cpc", utm_campaign: "diwali" })).toEqual({ source: "google", medium: "cpc", campaign: "diwali" });
  });
  it("takes first value from arrays and trims", () => {
    expect(extractUtm({ utm_source: ["  fb  ", "x"] })).toEqual({ source: "fb", medium: null, campaign: null });
  });
  it("missing/empty → null", () => {
    expect(extractUtm({ utm_source: "" })).toEqual({ source: null, medium: null, campaign: null });
    expect(extractUtm({})).toEqual({ source: null, medium: null, campaign: null });
  });
});
