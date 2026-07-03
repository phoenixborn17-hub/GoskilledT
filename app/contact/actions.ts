// /contact lead capture (Phase 1). Public write = abuse surface: Zod + per-IP rate limit, no PII
// echoed back. Lead upsert deduped on [phone, "contact"] (KB-10 handoff). Mirrors the webinar/earn
// server-action pattern — the same trusted upsert path, only the source/stage differ.
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
  name: z.string().trim().min(1, "Enter your name").max(80),
  phone: phoneSchema,
  utm: utmSchema.optional(),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

export async function submitContact(
  input: z.input<typeof schema>,
): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details",
    };

  const rl = rateLimit(`contact:${await clientIp()}`);
  if (!rl.ok)
    return {
      ok: false,
      error: "Too many attempts. Please try again in a few minutes.",
    };

  try {
    const lead = buildLeadData({
      name: parsed.data.name,
      phone: parsed.data.phone,
      source: "contact",
      stage: "NEW",
      utm: parsed.data.utm,
    });
    await upsertLead(lead);
    await track("contact_submitted", anonId(lead.phone), {
      source: "contact",
      utm_source: lead.utmSource,
      utm_campaign: lead.utmCampaign,
    });
    return { ok: true }; // never echo PII back
  } catch {
    return { ok: false, error: "Could not send. Please try again." };
  }
}
