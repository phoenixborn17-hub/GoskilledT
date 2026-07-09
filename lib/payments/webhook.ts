// Razorpay webhook ADAPTER (Ticket 2, Task 4). The ONLY path that credits money
// (Golden Rule 2). Strictly: verify signature → load state → decideWebhookActions()
// (pure) → execute the returned actions in ONE $transaction → record WebhookEvent.
// ZERO business decisions live here — every decision comes from the domain rules.
import { createHash } from "node:crypto";
import { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { requireEnv } from "../env";
import { verifyWebhookSignature } from "../../modules/payments/razorpay";
import { webhookEnvelopeSchema } from "../../modules/payments/schemas";
import {
  decideWebhookActions,
  type Action,
  type OrderState,
  type WebhookEventKind,
} from "../../modules/payments/webhook-flow";
import { resolveUplines } from "../../modules/affiliate/upline";
import { buildCommissionTxns } from "../../modules/affiliate/credit";
import { buildClawbackTxns } from "../../modules/affiliate/clawback";
import { canEarnCommission } from "../../modules/affiliate/eligibility";
import { coursesToEnroll } from "../../modules/lms/entitlement";
import type { PackageSlug } from "../../modules/affiliate/commission";
import { executeTxSpec } from "../../modules/ledger/persist";
import type { AccountRef, TxSpec } from "../../modules/ledger/ledger";
import { track } from "../analytics/track";
import type { AnalyticsEventName } from "../../modules/analytics/events";
import { sendPurchaseReceipt } from "../email/send";

const PROVIDER = "razorpay";

export interface WebhookResult {
  status: 200 | 400;
  note?: string;
}

type Tx = Prisma.TransactionClient;

// Full order context needed to execute actions (enroll / credit / clawback).
type OrderContext = Prisma.OrderGetPayload<{
  include: {
    package: { include: { courses: { select: { courseId: true } } } };
  };
}>;

/** Map a verified envelope + the located order to the pure WebhookEventKind. */
function toEventKind(
  event: string,
  envelope: ReturnType<typeof webhookEnvelopeSchema.parse>,
  orderId: string,
): WebhookEventKind | null {
  const payment = envelope.payload.payment?.entity;
  const refund = envelope.payload.refund?.entity;
  if (event === "payment.captured" && payment)
    return {
      kind: "payment.captured",
      orderId,
      paymentId: payment.id,
      amountInPaise: payment.amount,
    };
  if (event === "payment.failed" && payment)
    return { kind: "payment.failed", orderId, paymentId: payment.id };
  if (event === "refund.processed" && refund)
    return {
      kind: "refund.processed",
      orderId,
      refundId: refund.id,
      amountInPaise: refund.amount,
    };
  return null;
}

function toAccountRef(type: string, userId: string | null): AccountRef {
  switch (type) {
    case "USER_WALLET":
      if (!userId) throw new Error("USER_WALLET account missing userId");
      return { kind: "USER_WALLET", userId };
    case "COMMISSION_PAYABLE":
    case "REVENUE":
    case "PAYOUT_CLEARING":
    case "GST_PAYABLE":
      return { kind: type };
    default:
      throw new Error(`Unknown account type: ${type}`);
  }
}

/** Walk up the referral chain (max `hops`) — the input to resolveUplines(). */
async function fetchReferralChain(
  tx: Tx,
  buyerId: string,
  hops = 3,
): Promise<string[]> {
  const chain: string[] = [];
  let current = buyerId;
  for (let i = 0; i < hops; i++) {
    const u = await tx.user.findUnique({
      where: { id: current },
      select: { referredById: true },
    });
    if (!u?.referredById) break;
    chain.push(u.referredById);
    current = u.referredById;
  }
  return chain;
}

/** Reconstruct the persisted COMMISSION TxSpecs of an order — input to buildClawbackTxns(). */
async function loadCommissionTxSpecs(
  tx: Tx,
  orderId: string,
): Promise<TxSpec[]> {
  const txns = await tx.ledgerTransaction.findMany({
    where: { type: "COMMISSION", refType: "Order", refId: orderId },
    include: {
      entries: {
        include: { account: { select: { type: true, userId: true } } },
      },
    },
  });
  return txns.map((t) => ({
    type: "COMMISSION" as const,
    idempotencyKey: t.idempotencyKey,
    refType: t.refType ?? undefined,
    refId: t.refId ?? undefined,
    legs: t.entries.map((e) => ({
      account: toAccountRef(e.account.type, e.account.userId),
      amountInPaise: e.amountInPaise,
      holdUntil: e.holdUntil ?? undefined,
    })),
  }));
}

/** Courses granted by an order's package (for enroll + revoke). */
function grantedCourseIds(order: OrderContext): string[] {
  const result = coursesToEnroll(
    {
      slug: order.package.slug as PackageSlug,
      includesFutureCourses: order.package.includesFutureCourses,
      courseIds: order.package.courses.map((c) => c.courseId),
    },
    order.chosenCourseId,
  );
  if (!result.ok) throw new Error(result.reason);
  return result.courseIds;
}

async function executeAction(
  tx: Tx,
  action: Action,
  order: OrderContext,
  now: Date,
): Promise<void> {
  switch (action.do) {
    case "MARK_PAID":
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          razorpayPaymentId: action.paymentId,
          paidAt: now,
        },
      });
      return;
    case "MARK_FAILED":
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return;
    case "MARK_REFUNDED":
      await tx.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });
      return;
    case "ENROLL": {
      const courseIds = grantedCourseIds(order);
      await tx.enrollment.createMany({
        data: courseIds.map((courseId) => ({
          userId: order.userId,
          courseId,
          source: "PACKAGE" as const,
        })),
        skipDuplicates: true,
      });
      return;
    }
    case "REVOKE_ENROLLMENTS": {
      const courseIds = grantedCourseIds(order);
      await tx.enrollment.deleteMany({
        where: { userId: order.userId, courseId: { in: courseIds } },
      });
      return;
    }
    case "CREDIT_COMMISSIONS": {
      const chain = await fetchReferralChain(tx, order.userId);
      const resolved = resolveUplines(order.userId, chain);
      if (resolved.length === 0) return;
      // ── DR-038 earning gate — LIVE ENFORCEMENT (Phase B / B1, Tier-A) ────────────────────────
      // Credit an upline ONLY if they have their OWN confirmed (PAID) purchase — a referral link or
      // free registration alone never earns. Eligibility is evaluated NOW (credit time = the moment
      // the downline's payment verified); there is NO retroactive backfill if an upline buys later
      // (locked behaviour — flagged for founder/Fable confirmation). An ineligible upline is SKIPPED
      // ENTIRELY: no credit, and NO roll-up of their commission to the next level — each surviving
      // hop keeps its original level/amount (conservative default; never pays more than earned —
      // protects the thin referred-margin, AR-1). Roll-up of skipped commission is a separate
      // founder/Fable money-policy decision — NOT implemented here.
      // Read is INSIDE this tx (mirrors lib/affiliate/eligibility.hasConfirmedPurchase). Idempotency
      // keys, HELD lifecycle (DR-025), clawback and DR-007 amounts are all preserved unchanged.
      const uplines = [];
      for (const hop of resolved) {
        const ownPaid = await tx.order.count({
          where: { userId: hop.userId, status: "PAID" },
        });
        if (canEarnCommission({ hasOwnConfirmedPurchase: ownPaid > 0 }))
          uplines.push(hop);
      }
      if (uplines.length === 0) return;
      const specs = buildCommissionTxns({
        orderId: order.id,
        pkg: order.package.slug as PackageSlug,
        paidAt: now, // MARK_PAID set paidAt = now in this same tx
        uplines,
      });
      for (const spec of specs) await executeTxSpec(tx, spec);
      return;
    }
    case "CLAWBACK_COMMISSIONS": {
      const commissionSpecs = await loadCommissionTxSpecs(tx, order.id);
      const clawbacks = buildClawbackTxns(order.id, commissionSpecs);
      for (const spec of clawbacks) await executeTxSpec(tx, spec);
      return;
    }
    case "FLAG_MANUAL_REVIEW":
      await tx.adminAction.create({
        data: {
          actorSupabaseId: "system",
          action: "FLAG_MANUAL_REVIEW",
          entity: "Order",
          entityId: order.id,
          meta: { reason: action.reason },
        },
      });
      return;
  }
}

/** Locate our internal order from the webhook payload (razorpay order id / payment id). */
async function locateOrder(
  event: string,
  envelope: ReturnType<typeof webhookEnvelopeSchema.parse>,
): Promise<OrderContext | null> {
  const include = {
    package: { include: { courses: { select: { courseId: true } } } },
  } as const;
  const payment = envelope.payload.payment?.entity;
  const refund = envelope.payload.refund?.entity;
  if ((event === "payment.captured" || event === "payment.failed") && payment)
    return prisma.order.findUnique({
      where: { razorpayOrderId: payment.order_id },
      include,
    });
  if (event === "refund.processed" && refund)
    return prisma.order.findUnique({
      where: { razorpayPaymentId: refund.payment_id },
      include,
    });
  return null;
}

/**
 * Process one Razorpay webhook. Returns 400 ONLY on a bad signature; otherwise 200
 * after processing (idempotent). Importable by both the route and the integration test.
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string | null,
  eventIdHeader?: string | null,
): Promise<WebhookResult> {
  const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!signature || !verifyWebhookSignature(rawBody, signature, secret))
    return { status: 400, note: "bad signature" };

  // Signature verified → safe to parse.
  const envelope = webhookEnvelopeSchema.parse(JSON.parse(rawBody));
  const event = envelope.event;

  const entityId =
    envelope.payload.payment?.entity.id ??
    envelope.payload.refund?.entity.id ??
    "unknown";
  const eventId =
    eventIdHeader && eventIdHeader.length > 0
      ? eventIdHeader
      : `${event}:${entityId}`;
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  // We only act on the three money events; ack everything else so Razorpay stops retrying.
  if (
    !["payment.captured", "payment.failed", "refund.processed"].includes(event)
  )
    return { status: 200, note: "ignored event" };

  const alreadyProcessed = !!(await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: PROVIDER, eventId } },
    select: { id: true },
  }));
  if (alreadyProcessed)
    return { status: 200, note: "duplicate — idempotent skip" };

  const order = await locateOrder(event, envelope);
  const orderState: OrderState | null = order
    ? {
        id: order.id,
        status: order.status,
        amountInPaise: order.amountInPaise,
        paidAt: order.paidAt,
      }
    : null;

  const eventKind = toEventKind(event, envelope, order?.id ?? "");
  if (!eventKind) return { status: 200, note: "unmappable payload" };

  const now = new Date();
  const decision = decideWebhookActions(eventKind, orderState, {
    alreadyProcessed: false,
    now,
  });

  try {
    await prisma.$transaction(
      async (tx) => {
        for (const action of decision.actions) {
          if (!order) throw new Error("action decided for a missing order"); // defensive — decide returns [] when order is null
          await executeAction(tx, action, order, now);
        }
        await tx.webhookEvent.create({
          data: { provider: PROVIDER, eventId, payloadHash },
        });
      },
      { timeout: 20_000 },
    );
  } catch (e) {
    // A concurrent delivery recorded the same event first → treat as an idempotent duplicate.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { status: 200, note: "duplicate — raced" };
    throw e;
  }

  // Analytics: emit AFTER the money tx committed (never inside it). track() is fail-safe, so a
  // sink outage can't break the webhook; we only reach here on a fresh, successfully-processed
  // event. `purchase` is money-truth — it fires exactly once per order (webhook idempotency).
  if (order) {
    await emitWebhookAnalytics(decision.actions, order);
    // Purchase receipt: same post-commit, fail-safe contract as analytics. Fires once per order
    // (fresh MARK_PAID + provider idempotency key). Never inside the money tx, never throws.
    if (decision.actions.some((a) => a.do === "MARK_PAID")) {
      await sendPurchaseReceipt({
        id: order.id,
        userId: order.userId,
        packageName: order.package.name,
        amountInPaise: order.amountInPaise,
        paidAt: order.paidAt ?? now,
      });
    }
  }

  return { status: 200, note: decision.note };
}

/** Map the committed webhook actions to at most one funnel event and capture it (best-effort). */
async function emitWebhookAnalytics(
  actions: readonly Action[],
  order: OrderContext,
): Promise<void> {
  const dos = new Set(actions.map((a) => a.do));
  const name: AnalyticsEventName | null = dos.has("MARK_PAID")
    ? "purchase"
    : dos.has("MARK_REFUNDED")
      ? "refund_processed"
      : dos.has("MARK_FAILED")
        ? "payment_failed"
        : null;
  if (!name) return;
  await track(name, order.userId, {
    order_id: order.id,
    package: order.package.slug,
    amount_paise: order.amountInPaise,
  });
}
