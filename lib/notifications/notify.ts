// Notification event hooks (Feature Batch v1.0 §1). Fired server-side at the source-of-truth
// transition — never recomputed in the UI. SIDE-EFFECT-ONLY by contract, mirroring
// lib/analytics/track.ts / lib/email/send.ts: every failure is caught and logged here, so a
// notification-insert outage can NEVER block or reverse the money/KYC transaction it rides
// alongside. Callers on hot paths should still call this AFTER their own transaction commits
// (never inside it) — same discipline as the webhook's post-commit analytics/receipt calls.
import { prisma } from "../prisma";
import { formatINRFromPaise } from "../format";
import { safeNext } from "../auth/post-auth";
import type { NotificationType } from "../generated/prisma";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** INTERNAL path only — validated with the same open-redirect guard as post-auth redirects.
   * An invalid/external value is dropped (null) rather than rejecting the whole notification. */
  linkUrl?: string;
}

/** Insert one notification. Resolves even on failure — notifications are best-effort by contract. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl ? (safeNext(input.linkUrl) ?? undefined) : undefined,
      },
    });
  } catch (e) {
    console.warn(
      `[notify] insert failed for user ${input.userId} (${input.type}):`,
      e instanceof Error ? e.message : e,
    );
  }
}

// ── Typed helpers — one per event, so copy/DR-043 rules live in exactly one place each ──────────

/** DR-043: "recorded", never "available to withdraw" / "ready now" — commission is earned, not payable yet. */
export async function notifyCommissionCredited(
  userId: string,
  amountInPaise: number,
): Promise<void> {
  await notify({
    userId,
    type: "COMMISSION_CREDITED",
    title: "Commission recorded",
    body: `${formatINRFromPaise(amountInPaise)} commission recorded.`,
    linkUrl: "/dashboard/earn/commissions",
  });
}

/** No PII in the body (DR-038) — status only. KYC is de-duplicated to Account in the nav. */
export async function notifyKycStatus(
  userId: string,
  status: "APPROVED" | "REJECTED",
): Promise<void> {
  const label = status === "APPROVED" ? "verified" : "not approved";
  await notify({
    userId,
    type: "KYC_STATUS",
    title: "KYC status updated",
    body: `Your KYC is now ${label}.`,
    linkUrl: "/dashboard/profile",
  });
}

/** Factual, past-tense — this only fires once a real payout has already been marked PAID (D-01-gated). */
export async function notifyWithdrawalPaid(
  userId: string,
  amountInPaise: number,
): Promise<void> {
  await notify({
    userId,
    type: "WITHDRAWAL_PAID",
    title: "Withdrawal paid",
    body: `Withdrawal of ${formatINRFromPaise(amountInPaise)} marked paid.`,
    linkUrl: "/dashboard/earn/wallet",
  });
}

export async function notifyCertificateIssued(
  userId: string,
  courseTitle: string,
): Promise<void> {
  await notify({
    userId,
    type: "CERTIFICATE_ISSUED",
    title: "Certificate earned",
    body: `Your certificate for ${courseTitle} is ready.`,
    linkUrl: "/dashboard/progress",
  });
}

/**
 * MILESTONE is the one event with no discrete write-transition to hook (milestones are DERIVED,
 * never stored — lib/dashboard/gamification.ts). The recomputation itself IS the source of truth
 * for "has this been achieved", so this is called from that same server-side read, gated on a
 * dedup check against Notification.title (there's no separate milestone-tracking table — the
 * Notification row already sent for a given (userId, title) is used as the "already notified"
 * marker, keeping the schema exactly what the spec defines). Accepted trade-off: a rare concurrent
 * double-load race could in theory insert two rows for the same milestone — low-stakes (a cosmetic
 * duplicate in a non-money notification), not worth a dedicated unique constraint for.
 */
export async function notifyMilestoneIfNew(
  userId: string,
  label: string,
): Promise<void> {
  const title = `Milestone: ${label}`;
  try {
    const already = await prisma.notification.findFirst({
      where: { userId, type: "MILESTONE", title },
      select: { id: true },
    });
    if (already) return;
  } catch (e) {
    console.warn(
      `[notify] milestone dedup check failed for user ${userId}:`,
      e instanceof Error ? e.message : e,
    );
    return; // fail safe: skip rather than risk a duplicate on a lookup error
  }
  await notify({
    userId,
    type: "MILESTONE",
    title,
    body: `${label} — nice work!`,
    linkUrl: "/dashboard/progress",
  });
}
