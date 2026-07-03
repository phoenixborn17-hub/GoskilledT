// Pure lead-shaping (Ticket 6). No DB, no framework — the single source of truth for how a
// public form + URL params become a Lead row (KB-10 handoff contract). Adapters persist it.
// (New module; existing rule modules untouched.)

export type LeadStage = "NEW" | "CONTACTED" | "WEBINAR_REGISTERED" | "CONVERTED" | "LOST";

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
}

/** Pull utm_source/medium/campaign from URL search params (first value, trimmed, or null). */
export function extractUtm(params: Record<string, string | string[] | undefined>): UtmParams {
  const get = (k: string): string | null => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s : null;
  };
  return { source: get("utm_source"), medium: get("utm_medium"), campaign: get("utm_campaign") };
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
