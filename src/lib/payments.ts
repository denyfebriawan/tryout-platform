// Applies a verified Midtrans notification to the database. This is the only place that grants premium.
import "server-only";

import type { PaymentStatus, Prisma } from "@/generated/prisma/client";
import { type MidtransNotification, nextPaymentStatus, statusFromNotification } from "@/lib/midtrans-notification";
import { prisma } from "@/lib/prisma";

export type ApplyNotificationResult = "updated" | "unchanged" | "unknown-order" | "amount-mismatch";

// Midtrans can send the same notification more than once, and two copies can arrive at the same
// time. The row lock below makes them run one after another, and nextPaymentStatus() turns every
// copy after the first into a no-op, so premium is granted exactly once.
// `raw` is the full request body, stored as-is for debugging.
export async function applyNotification(
  notification: MidtransNotification,
  raw: unknown,
): Promise<ApplyNotificationResult> {
  const incoming = statusFromNotification(notification.transaction_status, notification.fraud_status);

  return prisma.$transaction(async (tx) => {
    // FOR UPDATE: a second notification for the same order waits here until this transaction commits.
    const [payment] = await tx.$queryRaw<{ id: string; userId: string; amount: number; status: PaymentStatus }[]>`
      SELECT id, "userId", amount, status FROM "Payment" WHERE "orderId" = ${notification.order_id} FOR UPDATE`;
    if (!payment) return "unknown-order";

    // The signature proves Midtrans sent it; this proves it's for the price we asked for.
    if (Number(notification.gross_amount) !== payment.amount) return "amount-mismatch";

    const next = incoming && nextPaymentStatus(payment.status, incoming);
    if (!next) return "unchanged";

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: next,
        midtransTransactionId: notification.transaction_id,
        paymentType: notification.payment_type,
        rawNotification: raw as Prisma.InputJsonValue,
        paidAt: next === "PAID" ? new Date() : undefined,
      },
    });
    // Same transaction: a payment is never PAID without the user being premium, or the other way round.
    if (next === "PAID") {
      await tx.user.update({ where: { id: payment.userId }, data: { isPremium: true } });
    }
    return "updated";
  });
}
