// Shell chrome state (Command_Center_Spec §1.2 R2/R3) — the sidebar snapshots + honest switcher
// pips, composed server-side from EXISTING reads only. Presentation data for the AppShell; no new
// business logic. DR-040: earn data is only fetched (and only present) when the Affiliate layer is
// visible. DR-043: the earn snapshot says "recorded", never a payable framing. Money reaches the
// client pre-formatted from finite ledger values only (non-finite → snapshot omitted, never ₹0).
import { getEnrolledCourses } from "../lms/queries";
import { getGamification } from "../dashboard/gamification";
import { isEligibleToEarn } from "../affiliate/eligibility";
import { getReferralTree } from "../affiliate/referrals";
import { getWalletSummaryFor } from "../wallet/queries";
import { formatINRFromPaise, formatCount } from "../format";
import type { WorkspaceKey } from "./workspaces";
import type { WorkspaceSnapshot } from "../../components/nav/sidebar-snapshot";

export interface ShellState {
  snapshots: Partial<Record<WorkspaceKey, WorkspaceSnapshot>>;
  pips: Partial<Record<WorkspaceKey, boolean>>;
}

export async function getShellState(
  userId: string,
  userName: string,
  affiliateVisible: boolean,
): Promise<ShellState> {
  const [enrolled, game] = await Promise.all([
    getEnrolledCourses(userId),
    getGamification(userId),
  ]);

  const snapshots: ShellState["snapshots"] = {};
  const pips: ShellState["pips"] = {};

  // Learn — real courses + overall %, honest zero for new users.
  if (enrolled.length > 0) {
    const overall = Math.round(
      enrolled.reduce((s, c) => s + c.progress.percent, 0) / enrolled.length,
    );
    snapshots.learn = {
      primary: `${enrolled.length} ${enrolled.length === 1 ? "course" : "courses"} · ${overall}%`,
      caption: "your learning so far",
    };
  } else {
    snapshots.learn = {
      primary: "Start your first course",
      caption: "2 minutes to your first win",
    };
  }

  // Account — the user, plainly.
  snapshots.account = { primary: userName, caption: "your account" };

  // Honest pip: streak at risk today → a Spark on Learn (supportive, real trigger only).
  const atRisk = game.streak.current > 0 && game.streak.state === "resting";
  if (atRisk) pips.learn = true;

  // Earn — only when the Affiliate layer is visible (DR-040). Eligible → DR-043 recorded framing;
  // not eligible → people, never ₹ (DR-038).
  if (affiliateVisible) {
    const eligible = await isEligibleToEarn(userId);
    if (eligible) {
      const w = await getWalletSummaryFor(userId);
      if (Number.isFinite(w.totalInPaise)) {
        snapshots.earn = {
          primary: `${formatINRFromPaise(w.totalInPaise)} recorded`,
          caption: "your earnings so far",
        };
      }
    } else {
      const tree = await getReferralTree(userId);
      snapshots.earn = {
        primary: `${formatCount(tree.l1Count)} ${tree.l1Count === 1 ? "friend" : "friends"}`,
        caption: "your network",
      };
    }
  }

  return { snapshots, pips };
}
