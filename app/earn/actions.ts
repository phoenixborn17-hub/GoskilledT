// /earn waitlist (Ticket 6, Task 2). Public write: Zod + per-IP rate limit, no PII echoed.
// Lead upsert deduped on [phone, "earn-waitlist"]. D-01/D-29: no numbers collected or returned.
"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { phoneSchema } from "../../modules/payments/schemas";
import { buildLeadData } from "../../modules/crm/lead";
import { upsertLead } from "../../lib/crm/leads";
import { rateLimit } from "../../lib/rate-limit";
import { track, anonId } from "../../lib/analytics/track";

const utmSchema = z.object({
  source: z.string().nullable(),
  medium: z.string().nullable(),
  campaign: z.string().nullable(),
});

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  phone: phoneSchema,
  utm: utmSchema.optional(),
});

export type WaitlistResult = { ok: true } | { ok: false; error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

export async function joinWaitlist(
  input: z.input<typeof schema>,
): Promise<WaitlistResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };

  const rl = rateLimit(`earn:${await clientIp()}`);
  if (!rl.ok)
    return {
      ok: false,
      error: "Too many attempts. Please try again in a few minutes.",
    };

  try {
    const lead = buildLeadData({
      name: parsed.data.name,
      phone: parsed.data.phone,
      source: "earn-waitlist",
      stage: "NEW",
      utm: parsed.data.utm,
    });
    await upsertLead(lead);
    await track("waitlist_joined", anonId(lead.phone), {
      source: "earn-waitlist",
      utm_source: lead.utmSource,
      utm_campaign: lead.utmCampaign,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not join. Please try again." };
  }
}
