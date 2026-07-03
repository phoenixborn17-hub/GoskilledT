// Ticket 6, Task 4 — lead upsert against the live DB (skips without DATABASE_URL).
// dedup on [phone, source], UTM captured, first-touch attribution preserved on re-register.
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { upsertLead } from "@/lib/crm/leads";
import { buildLeadData } from "@/modules/crm/lead";

const HAS_DB = !!process.env.DATABASE_URL;
const phone10 = "9" + String(Date.now()).slice(-9);
const e164 = `+91${phone10}`;

describe.skipIf(!HAS_DB)("lead flow (integration)", () => {
  it("webinar registration creates a correct Lead with UTM", async () => {
    await upsertLead(buildLeadData({
      name: "Test User", phone: phone10, source: "webinar", stage: "WEBINAR_REGISTERED",
      utm: { source: "insta", medium: "reel", campaign: "launch" },
    }));
    const lead = await prisma.lead.findUnique({ where: { phone_source: { phone: e164, source: "webinar" } } });
    expect(lead?.stage).toBe("WEBINAR_REGISTERED");
    expect(lead?.name).toBe("Test User");
    expect(lead?.utmSource).toBe("insta");
    expect(lead?.utmCampaign).toBe("launch");
  });

  it("duplicate registration → single row, first-touch attribution preserved", async () => {
    await upsertLead(buildLeadData({
      name: "Updated Name", phone: phone10, source: "webinar", stage: "WEBINAR_REGISTERED",
      utm: { source: "CHANGED", medium: "CHANGED", campaign: "CHANGED" },
    }));
    const rows = await prisma.lead.findMany({ where: { phone: e164, source: "webinar" } });
    expect(rows.length).toBe(1); // deduped
    expect(rows[0].name).toBe("Updated Name"); // name refreshed
    expect(rows[0].utmSource).toBe("insta"); // attribution NOT clobbered
  });

  it("same phone, different source → a separate lead (dedup is per [phone, source])", async () => {
    await upsertLead(buildLeadData({ phone: phone10, source: "earn-waitlist", stage: "NEW" }));
    const waitlist = await prisma.lead.findUnique({ where: { phone_source: { phone: e164, source: "earn-waitlist" } } });
    expect(waitlist?.source).toBe("earn-waitlist");
    expect(await prisma.lead.count({ where: { phone: e164 } })).toBe(2); // webinar + waitlist
  });
});
