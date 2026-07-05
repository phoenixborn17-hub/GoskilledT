// GPS-M5 §2.0 — "cost caps are architecture." PURE decision; the adapter (lib/ai/guru.ts) supplies
// today's counts + the configured limits. A cap hit is an HONEST state ("Guru thak gaya aaj ke liye"),
// never a silent failure. Two independent limits: per-user daily messages + a global daily token budget.

// Safe defaults (LC #36 — real values set via env pre-launch). Generous enough for a real learner,
// tight enough that a runaway/abuse loop can't burn the budget.
export const DEFAULT_DAILY_MSG_CAP = 30;
export const DEFAULT_DAILY_TOKEN_BUDGET = 2_000_000;

export interface CapInput {
  userMsgsToday: number; // GuruMessage rows for this user since local midnight
  globalTokensToday: number; // prompt+completion tokens across ALL users today
  dailyMsgCap: number;
  dailyTokenBudget: number;
}

export type CapReason = "user-daily" | "global-budget";

export interface CapDecision {
  capped: boolean;
  reason?: CapReason;
}

/** PURE: is this turn capped, and by which limit? Per-user checked first (clearer learner message). */
export function decideCap(input: CapInput): CapDecision {
  if (input.userMsgsToday >= input.dailyMsgCap)
    return { capped: true, reason: "user-daily" };
  if (input.globalTokensToday >= input.dailyTokenBudget)
    return { capped: true, reason: "global-budget" };
  return { capped: false };
}

// Honest Hinglish capped-state copy (LC #37 slot). Never blames the learner.
export function cappedMessage(reason: CapReason): string {
  return reason === "user-daily"
    ? "Guru aaj ke liye thak gaya 😴 — aaj bahut saare doubts solve ho gaye! Kal fresh mind ke saath phir milte hain."
    : "Guru abhi thoda busy hai — thodi der baad phir try karo, main yahin hoon.";
}
