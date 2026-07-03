// Email send helpers (2a). Like analytics track(), email is BEST-EFFORT and must NEVER break a
// money path (Golden Rule 2/3): every failure is swallowed and logged. sendPurchaseReceipt() is
// called from the webhook AFTER the money tx commits — never inside it.
import { prisma } from "../prisma";
import { getEmailProvider } from "./provider";
import { buildReceiptEmail, type EmailMessage } from "./receipt";

/** Send one email. Resolves even on failure — email is best-effort by contract. */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  try {
    await getEmailProvider().send(msg);
  } catch (e) {
    console.warn(
      `[email] send failed for "${msg.idempotencyKey}":`,
      e instanceof Error ? e.message : e,
    );
  }
}

/**
 * Send the purchase receipt for a PAID order. At-most-once per order (idempotency key
 * "receipt:{orderId}" + the webhook only fires this on a fresh MARK_PAID). Skips (and logs) if the
 * buyer has no email yet — name/email are collected in /onboarding AFTER purchase (DR-023), so a
 * just-purchased buyer legitimately may not have one; the receipt is best-effort, not blocking.
 */
export async function sendPurchaseReceipt(order: {
  id: string;
  userId: string;
  packageName: string;
  amountInPaise: number;
  paidAt: Date | null;
}): Promise<void> {
  let user: { email: string | null; name: string | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, name: true },
    });
  } catch (e) {
    console.warn(
      `[email] receipt lookup failed for order ${order.id}:`,
      e instanceof Error ? e.message : e,
    );
    return;
  }

  if (!user?.email) {
    console.warn(
      `[email] receipt skipped for order ${order.id} — buyer has no email yet`,
    );
    return;
  }

  const msg = buildReceiptEmail({
    orderId: order.id,
    toEmail: user.email,
    buyerName: user.name,
    packageName: order.packageName,
    amountInPaise: order.amountInPaise,
    paidAt: order.paidAt ?? new Date(),
  });
  await sendEmail(msg);
}
