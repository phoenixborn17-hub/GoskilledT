// Pure lead-shaping (Ticket 6). No DB, no framework — the single source of truth for how a
// public form + URL params become a Lead row (KB-10 handoff contract). Adapters persist it.
// (New module; existing rule modules untouched.)

export type LeadStage =
  "NEW" | "CONTACTED" | "WEBINAR_REGISTERED" | "CONVERTED" | "LOST";

// Stage ordering for the AUTOMATED public-upsert path (Ticket 8, Task 0). A lead must never
// move BACKWARD on its own: a buyer who already CONVERTED (bought) can re-submit the webinar
// form a week later — that must never undo the sale. CONVERTED is terminal/sticky. LOST (an
// admin disposition) also outranks the automated funnel stages so a stray re-registration
// can't silently resurrect it. Admin's explicit, audited updateLeadStage is a SEPARATE trusted
// authority and intentionally bypasses this rule (a human can correct a mistake).
const STAGE_RANK: Record<LeadStage, number> = {
  NEW: 0,
  CONTACTED: 1,
  WEBINAR_REGISTERED: 2,
  LOST: 3,
  CONVERTED: 4,
};

/** Pure: the further-along of two stages. Never downgrades; CONVERTED always wins. */
export function mergeStage(current: LeadStage, incoming: LeadStage): LeadStage {
  return STAGE_RANK[incoming] > STAGE_RANK[current] ? incoming : current;
}

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
}

/** Pull utm_source/medium/campaign from URL search params (first value, trimmed, or null). */
export function extractUtm(
  params: Record<string, string | string[] | undefined>,
): UtmParams {
  const get = (k: string): string | null => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s : null;
  };
  return {
    source: get("utm_source"),
    medium: get("utm_medium"),
    campaign: get("utm_campaign"),
  };
}

export interface BuildLeadInput {
  name?: string | null;
  phone: string; // validated 10-digit Indian mobile
  source: string; // "webinar" | "earn-waitlist" | ...
  stage: LeadStage;
  utm?: UtmParams;
  packageInterest?: string | null;
}

export interface LeadData {
  phone: string; // canonical +91XXXXXXXXXX (matches User.phone format)
  source: string;
  name: string | null;
  stage: LeadStage;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  packageInterest: string | null;
}

export function buildLeadData(input: BuildLeadInput): LeadData {
  return {
    phone: `+91${input.phone}`,
    source: input.source,
    name: input.name?.trim() || null,
    stage: input.stage,
    utmSource: input.utm?.source ?? null,
    utmMedium: input.utm?.medium ?? null,
    utmCampaign: input.utm?.campaign ?? null,
    packageInterest: input.packageInterest?.trim() || null,
  };
}
