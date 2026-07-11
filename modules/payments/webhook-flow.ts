// Pure webhook decision engine — given verified event + current state, decide actions.
// The route handler: verify signature → load state → decide() → execute actions in ONE
// DB transaction → record WebhookEvent. Zero business decisions live in the route.
import { isWithinRefundWindow } from "../affiliate/commission";

export interface OrderState {
  id: string;
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  amountInPaise: number; // expected charge (GST-inclusive display price)
  paidAt?: Date | null;
}

export type WebhookEventKind =
  | {
      kind: "payment.captured";
      orderId: string;
      paymentId: string;
      amountInPaise: number;
    }
  | { kind: "payment.failed"; orderId: string; paymentId: string }
  | {
      kind: "refund.processed";
      orderId: string;
      refundId: string;
      amountInPaise: number;
    };

export type Action =
  | { do: "MARK_PAID"; orderId: string; paymentId: string }
  | { do: "ENROLL"; orderId: string } // → lms/entitlement
  | { do: "CREDIT_COMMISSIONS"; orderId: string } // → affiliate/credit (HELD, DR-025)
  | { do: "MARK_FAILED"; orderId: string }
  | { do: "MARK_REFUNDED"; orderId: string }
  | { do: "CLAWBACK_COMMISSIONS"; orderId: string } // → affiliate/clawback
  | { do: "REVOKE_ENROLLMENTS"; orderId: string }
  | { do: "FLAG_MANUAL_REVIEW"; orderId: string; reason: string };

export interface Decision {
  actions: Action[];
  note?: string;
}

export function decideWebhookActions(
  event: WebhookEventKind,
  order: OrderState | null,
  opts: { alreadyProcessed: boolean; now?: Date },
): Decision {
  if (opts.alreadyProcessed)
    return { actions: [], note: "duplicate webhook — idempotent skip" };
  if (!order) return { actions: [], note: "unknown order — log only" };
  const now = opts.now ?? new Date();

  switch (event.kind) {
    case "payment.captured": {
      if (order.status === "PAID")
        return { actions: [], note: "already paid — idempotent skip" };
      if (order.status === "REFUNDED")
        return {
          actions: [
            {
              do: "FLAG_MANUAL_REVIEW",
              orderId: order.id,
              reason: "capture after refund",
            },
          ],
        };
      if (event.amountInPaise !== order.amountInPaise)
        return {
          actions: [
            {
              do: "FLAG_MANUAL_REVIEW",
              orderId: order.id,
              reason: `amount mismatch: got ${event.amountInPaise}, expected ${order.amountInPaise}`,
            },
          ],
        };
      // The golden path: paid → access ≤60s → commissions HELD (DR-025).
      return {
        actions: [
          { do: "MARK_PAID", orderId: order.id, paymentId: event.paymentId },
          { do: "ENROLL", orderId: order.id },
          { do: "CREDIT_COMMISSIONS", orderId: order.id },
        ],
      };
    }
    case "payment.failed": {
      if (order.status !== "CREATED")
        return { actions: [], note: "failure for non-pending order — skip" };
      return { actions: [{ do: "MARK_FAILED", orderId: order.id }] };
    }
    case "refund.processed": {
      if (order.status !== "PAID")
        return {
          actions: [
            {
              do: "FLAG_MANUAL_REVIEW",
              orderId: order.id,
              reason: "refund for non-paid order",
            },
          ],
        };
      if (!order.paidAt)
        return {
          actions: [
            {
              do: "FLAG_MANUAL_REVIEW",
              orderId: order.id,
              reason: "refund but paidAt missing",
            },
          ],
        };
      if (event.amountInPaise !== order.amountInPaise) {
        // Partial (or mismatched) refund: only an exact-amount refund is a "full refund".
        // Auto-clawback + revoke would over-react to a partial money-back — route to a
        // human instead. Order stays PAID; commissions and enrollments untouched.
        return {
          actions: [
            {
              do: "FLAG_MANUAL_REVIEW",
              orderId: order.id,
              reason: `partial refund — manual handling (refunded ${event.amountInPaise} of ${order.amountInPaise})`,
            },
          ],
        };
      }
      if (isWithinRefundWindow(order.paidAt, now)) {
        // DR-025: within 48h — automatic clawback; commission never becomes available.
        return {
          actions: [
            { do: "MARK_REFUNDED", orderId: order.id },
            { do: "REVOKE_ENROLLMENTS", orderId: order.id },
            { do: "CLAWBACK_COMMISSIONS", orderId: order.id },
          ],
        };
      }
      // DR-025: post-window refunds are exceptional + MANUAL (negative ADJUSTMENT vs
      // future earnings — never reclaim paid-out money). Flag, don't auto-execute.
      return {
        actions: [
          { do: "MARK_REFUNDED", orderId: order.id },
          { do: "REVOKE_ENROLLMENTS", orderId: order.id },
          {
            do: "FLAG_MANUAL_REVIEW",
            orderId: order.id,
            reason:
              "post-window refund — manual future-earnings adjustment (DR-025)",
          },
        ],
      };
    }
  }
}
