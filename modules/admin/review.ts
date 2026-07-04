// Pure admin-domain decisions (GPS-M4 §1B state machines). No DB, no framework — the single
// source of truth for which admin transitions are legal. Adapters in lib/admin/* call these and
// then persist the domain write + audit row in ONE $transaction.

// ── KYC review: SUBMITTED → APPROVED / REJECTED (reason) ──
export type KycDecision = "APPROVE" | "REJECT";
export type KycReviewResult =
  | { ok: true; nextStatus: "APPROVED" | "REJECTED" }
  | { ok: false; code: string; message: string };

/** Only a SUBMITTED KYC can be decided; a reject requires a reason. */
export function decideKycReview(
  currentStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
  decision: KycDecision,
  reason?: string,
): KycReviewResult {
  if (currentStatus !== "SUBMITTED")
    return {
      ok: false,
      code: "NOT_REVIEWABLE",
      message: "Only submitted KYC records can be reviewed.",
    };
  if (decision === "REJECT" && !reason?.trim())
    return {
      ok: false,
      code: "REASON_REQUIRED",
      message: "A rejection reason is required.",
    };
  return { ok: true, nextStatus: decision === "APPROVE" ? "APPROVED" : "REJECTED" };
}

// ── Payout flag ceremony: OFF↔ON, gated by LC #1 (D-01 legal) + typed confirmation ──
export type FlagDirection = "ENABLE" | "DISABLE";
export const ENABLE_PHRASE = "ENABLE PAYOUTS";
export const DISABLE_PHRASE = "DISABLE PAYOUTS";

export type FlagFlipResult =
  | { ok: true; action: "PAYOUTS_ENABLED" | "PAYOUTS_DISABLED" }
  | { ok: false; code: string; message: string };

/**
 * Validate a payout-flag flip ceremony. Preconditions (GPS-M4 §1/§1B):
 *  - LC #1 (D-01 legal clearance) MUST be final before payouts can be turned on;
 *  - the direction must actually change state (no-op guard);
 *  - the admin must type the exact confirmation phrase.
 * ON→OFF (emergency) is always permitted with the phrase — you can always stop payouts.
 */
export function evaluatePayoutFlagFlip(input: {
  direction: FlagDirection;
  currentlyEnabled: boolean;
  lcOneFinal: boolean;
  typedConfirmation: string;
}): FlagFlipResult {
  const { direction, currentlyEnabled, lcOneFinal, typedConfirmation } = input;
  const wantEnabled = direction === "ENABLE";
  if (wantEnabled === currentlyEnabled)
    return {
      ok: false,
      code: "NO_CHANGE",
      message: `Payouts are already ${currentlyEnabled ? "ON" : "OFF"}.`,
    };
  if (wantEnabled && !lcOneFinal)
    return {
      ok: false,
      code: "LC1_NOT_FINAL",
      message:
        "Payouts cannot be enabled until D-01 legal clearance (LC #1) is final.",
    };
  const expected = wantEnabled ? ENABLE_PHRASE : DISABLE_PHRASE;
  if (typedConfirmation.trim() !== expected)
    return {
      ok: false,
      code: "CONFIRMATION_MISMATCH",
      message: `Type "${expected}" exactly to confirm.`,
    };
  return {
    ok: true,
    action: wantEnabled ? "PAYOUTS_ENABLED" : "PAYOUTS_DISABLED",
  };
}

// ── Course publish gate (GPS-M4 §1B): COMING_SOON/DRAFT → PUBLISHED ──
export type PublishGate = { ok: true } | { ok: false; message: string };

/**
 * A course may publish only with ≥1 module AND ≥1 lesson carrying a video asset id
 * (Stream UID or preview URL). Real content must exist before a course goes live.
 */
export function canPublishCourse(
  modules: { lessons: { videoAssetId: string | null }[] }[],
): PublishGate {
  if (modules.length === 0)
    return { ok: false, message: "Add at least one module before publishing." };
  const hasVideoLesson = modules.some((m) =>
    m.lessons.some((l) => !!l.videoAssetId?.trim()),
  );
  if (!hasVideoLesson)
    return {
      ok: false,
      message:
        "Add at least one lesson with a video asset id before publishing.",
    };
  return { ok: true };
}
