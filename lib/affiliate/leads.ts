// My-Leads adapter (Phase D · D3). Affiliate-uploaded leads for their own follow-up. PII (phone,
// email) is AES-256-GCM encrypted at rest (Phase-C pattern) and decrypted server-side ONLY, for the
// OWNER's own list. Owner-scoped everywhere — a query without the ownerId filter is never issued.
// Never logged. ⚠️ FLAGGED for Fable: whether the owner should see full vs masked phone, + retention.
import { prisma } from "../prisma";
import { encryptPii, decryptPii, maskLast4 } from "../pii";
import { normalizeWhatsapp, isValidEmail } from "../../modules/kyc/verify";

export interface LeadInput {
  name?: string;
  phone: string;
  email?: string;
  note?: string;
}

export interface LeadRow {
  id: string;
  name: string | null;
  phone: string; // full, decrypted for the owner (their own uploaded lead)
  email: string | null;
  note: string | null;
  status: string;
  createdAt: Date;
}

export interface LeadFilters {
  from?: Date;
  to?: Date;
}

export type CreateLeadResult =
  { ok: true; id: string } | { ok: false; error: string };

/** Create an owner-scoped lead. Phone required + validated; phone/email encrypted before storage. */
export async function createAffiliateLead(
  ownerId: string,
  input: LeadInput,
): Promise<CreateLeadResult> {
  const phone = normalizeWhatsapp(input.phone);
  if (!phone)
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const rawEmail = input.email?.trim();
  let emailEnc: string | null = null;
  if (rawEmail) {
    if (!isValidEmail(rawEmail))
      return { ok: false, error: "Enter a valid email or leave it blank." };
    emailEnc = encryptPii(rawEmail.toLowerCase());
  }
  try {
    const lead = await prisma.affiliateLead.create({
      data: {
        ownerId,
        name: input.name?.trim() || null,
        phoneEnc: encryptPii(phone),
        emailEnc,
        note: input.note?.trim() || null,
      },
      select: { id: true },
    });
    return { ok: true, id: lead.id };
  } catch {
    return { ok: false, error: "Could not save the lead. Please try again." };
  }
}

function safeDecrypt(payload: string): string {
  try {
    return decryptPii(payload);
  } catch {
    return "•••• ????"; // never surface ciphertext or throw into the UI
  }
}

/** The owner's leads (newest first), optionally filtered by created date. Owner-scoped. */
export async function listAffiliateLeads(
  ownerId: string,
  filters: LeadFilters = {},
): Promise<LeadRow[]> {
  const createdAt =
    filters.from || filters.to
      ? { gte: filters.from, lte: filters.to }
      : undefined;
  const rows = await prisma.affiliateLead.findMany({
    where: { ownerId, ...(createdAt ? { createdAt } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: safeDecrypt(r.phoneEnc),
    email: r.emailEnc ? safeDecrypt(r.emailEnc) : null,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

/** Admin/aggregate-safe masked view of a lead phone (if ever surfaced outside the owner). */
export function maskLeadPhone(fullPhone: string): string {
  return maskLast4(fullPhone);
}
