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

  it("re-registration NEVER downgrades a CONVERTED lead (sticky, Ticket 8 Task 0)", async () => {
    const p = "8" + String(Date.now()).slice(-9);
    const e = `+91${p}`;
    await upsertLead(buildLeadData({ phone: p, source: "webinar", stage: "WEBINAR_REGISTERED" }));
    // Simulate a completed sale (the admin/webhook path would set this).
    await prisma.lead.update({ where: { phone_source: { phone: e, source: "webinar" } }, data: { stage: "CONVERTED" } });
    // The buyer re-submits the webinar form weeks later — must not undo the sale.
    await upsertLead(buildLeadData({ name: "Later", phone: p, source: "webinar", stage: "WEBINAR_REGISTERED" }));
    const lead = await prisma.lead.findUnique({ where: { phone_source: { phone: e, source: "webinar" } } });
    expect(lead?.stage).toBe("CONVERTED"); // stage held
    expect(lead?.name).toBe("Later"); // name still refreshes
  });
});
