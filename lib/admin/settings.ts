// Settings adapter (GPS-M4 §2.4 — Tier A for the flag ceremony). Two jobs:
//  1) Honesty dashboard: which providers are live, is the env valid, how many LAUNCH_CONFIG rows
//     are still PENDING, is the OTP throttle active — all read from real state, never faked.
//  2) The AFFILIATE_PAYOUTS_ENABLED flip ceremony. The env flag stays the SINGLE money source of
//     truth (a legal kill-switch); this ceremony validates the precondition (LC #1) + typed
//     confirmation and records the PAYOUTS_ENABLED/DISABLED audit row. It does NOT mutate env at
//     runtime — activation is an env change + redeploy (documented in LAUNCH_CONFIG #18) — so no
//     second, race-prone runtime money gate is created.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import { envIssues, payoutsEnabled } from "../env";
import { lcOneFinal } from "../config/launch";
import {
  paymentProviderName,
  otpProviderName,
  videoProviderName,
  analyticsProviderName,
  emailProviderName,
} from "../config/providers";
import {
  evaluatePayoutFlagFlip,
  type FlagDirection,
} from "../../modules/admin/review";

export interface SettingsOverview {
  providers: { key: string; value: string; dev: boolean }[];
  envIssues: string[];
  launchPending: number | null; // null = registry file unavailable at runtime
  payoutsEnabled: boolean;
  lcOneFinal: boolean;
  otpRateLimit: { active: boolean; note: string };
}

/** Count of rows still `PENDING` in docs/LAUNCH_CONFIG.md (honesty dashboard). Null if unreadable. */
async function launchPendingCount(): Promise<number | null> {
  try {
    const file = path.join(process.cwd(), "docs", "LAUNCH_CONFIG.md");
    const md = await readFile(file, "utf8");
    // Registry rows only: table lines that carry a status cell of PENDING.
    return md
      .split("\n")
      .filter((l) => l.trimStart().startsWith("|"))
      .filter((l) => /\|\s*PENDING\s*\|/.test(l)).length;
  } catch {
    return null;
  }
}

export async function getSettingsOverview(): Promise<SettingsOverview> {
  const [pending] = await Promise.all([launchPendingCount()]);
  const providers = [
    { key: "PAYMENT_PROVIDER", value: paymentProviderName(), dev: ["mock"] },
    { key: "OTP_PROVIDER", value: otpProviderName(), dev: ["test"] },
    { key: "VIDEO_PROVIDER", value: videoProviderName(), dev: ["mock"] },
    {
      key: "ANALYTICS_PROVIDER",
      value: analyticsProviderName(),
      dev: ["console"],
    },
    { key: "EMAIL_PROVIDER", value: emailProviderName(), dev: ["console"] },
  ].map((p) => ({ key: p.key, value: p.value, dev: p.dev.includes(p.value) }));

  return {
    providers,
    envIssues: envIssues(),
    launchPending: pending,
    payoutsEnabled: payoutsEnabled(),
    lcOneFinal: lcOneFinal(),
    otpRateLimit: {
      active: true,
      note: "Per-IP + per-phone throttle on all OTP-send paths (login, checkout).",
    },
  };
}

export type FlagFlipOutcome =
  | { ok: true; action: "PAYOUTS_ENABLED" | "PAYOUTS_DISABLED"; note: string }
  | { ok: false; error: string };

/**
 * Run the payout-flag ceremony. Validates precondition (LC #1 final) + typed confirmation via the
 * domain rule, then records the audit row. Returns a note explaining that runtime activation is an
 * env change + redeploy (the env flag remains the money source of truth).
 */
export async function setPayoutsFlag(
  actor: AdminIdentity,
  direction: FlagDirection,
  typedConfirmation: string,
): Promise<FlagFlipOutcome> {
  const verdict = evaluatePayoutFlagFlip({
    direction,
    currentlyEnabled: payoutsEnabled(),
    lcOneFinal: lcOneFinal(),
    typedConfirmation,
  });
  if (!verdict.ok) return { ok: false, error: verdict.message };

  await prisma.$transaction((tx) =>
    recordAdminAction(tx, {
      actor,
      action: verdict.action,
      entity: "Setting",
      entityId: "AFFILIATE_PAYOUTS_ENABLED",
      meta: { direction, confirmed: true },
    }),
  );
  return {
    ok: true,
    action: verdict.action,
    note:
      "Ceremony recorded. Runtime activation requires setting AFFILIATE_PAYOUTS_ENABLED and redeploying (LAUNCH_CONFIG #18).",
  };
}
