// Pure rules for Midtrans payment notifications (webhooks). No database or env access, so they are
// unit tested and shared by the webhook route and the local notification simulator script.
import { createHash, timingSafeEqual } from "node:crypto";

import type { PaymentStatus } from "@/generated/prisma/client";

// The fields of a Midtrans HTTP notification that we use. Midtrans sends more (bank, va_numbers, ...),
// and we keep the whole body in Payment.rawNotification for debugging.
export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string; // e.g. "49000.00"
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
};

// The body arrives as untrusted JSON, so check the shape before using it.
export function parseNotification(body: unknown): MidtransNotification | null {
  if (typeof body !== "object" || body === null) return null;
  const value = body as Record<string, unknown>;
  const required = ["order_id", "status_code", "gross_amount", "signature_key", "transaction_status"] as const;
  if (!required.every((key) => typeof value[key] === "string")) return null;
  const optional = (key: string) => (typeof value[key] === "string" ? (value[key] as string) : undefined);

  return {
    order_id: value.order_id as string,
    status_code: value.status_code as string,
    gross_amount: value.gross_amount as string,
    signature_key: value.signature_key as string,
    transaction_status: value.transaction_status as string,
    fraud_status: optional("fraud_status"),
    transaction_id: optional("transaction_id"),
    payment_type: optional("payment_type"),
  };
}

// Midtrans signs each notification with SHA512(order_id + status_code + gross_amount + server key).
// Only Midtrans and our server know the server key, so a matching signature proves the sender.
export function midtransSignature(
  notification: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount">,
  serverKey: string,
): string {
  const { order_id, status_code, gross_amount } = notification;
  return createHash("sha512").update(order_id + status_code + gross_amount + serverKey).digest("hex");
}

export function hasValidSignature(notification: MidtransNotification, serverKey: string): boolean {
  const expected = Buffer.from(midtransSignature(notification, serverKey));
  const received = Buffer.from(notification.signature_key);
  // Constant-time compare, so response timing doesn't leak how many characters matched.
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// Translate Midtrans's transaction_status into our PaymentStatus. Returns null for statuses the demo
// doesn't act on (authorize, refund, partial_refund).
export function statusFromNotification(transactionStatus: string, fraudStatus?: string): PaymentStatus | null {
  switch (transactionStatus) {
    case "capture":
      // Card payments: "capture" is only final when the fraud check accepted it.
      if (fraudStatus === "accept") return "PAID";
      if (fraudStatus === "deny") return "FAILED";
      return "PENDING"; // "challenge": waiting for a manual review in the Midtrans dashboard
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
    case "failure":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    default:
      return null;
  }
}

// Which status to store when a notification arrives, or null to leave the payment as it is.
// PAID is final: a late or repeated notification can never take premium away again. A payment that
// failed or expired can still turn PAID, because then Midtrans really did receive the money.
export function nextPaymentStatus(current: PaymentStatus, incoming: PaymentStatus): PaymentStatus | null {
  if (current === "PAID") return null;
  if (incoming === "PAID") return "PAID";
  if (current === "PENDING" && incoming !== "PENDING") return incoming;
  return null;
}
