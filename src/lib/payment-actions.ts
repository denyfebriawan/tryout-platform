"use server";

import { randomUUID } from "node:crypto";

import { createSnapTransaction, isMidtransConfigured } from "@/lib/midtrans";
import { premiumPlan } from "@/lib/premium-plan";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type CheckoutResult =
  | { ok: true; orderId: string; snapToken: string }
  | { ok: false; error: "already-premium" | "unavailable" };

// Snap tokens stay valid for 24 hours. Reusing a recent one means clicking "Bayar" twice, or coming
// back after closing the popup, continues the same order instead of piling up pending ones.
const REUSE_TOKEN_MS = 23 * 60 * 60 * 1000;

// Starts (or resumes) a premium checkout and returns the Snap token for the payment popup.
// This only creates a PENDING payment. Premium is granted later by the webhook, never here.
export async function startPremiumCheckout(): Promise<CheckoutResult> {
  const user = await requireUser();
  if (user.isPremium) return { ok: false, error: "already-premium" };
  if (!isMidtransConfigured()) return { ok: false, error: "unavailable" };

  const pending = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
      amount: premiumPlan.priceIdr,
      snapToken: { not: null },
      createdAt: { gt: new Date(Date.now() - REUSE_TOKEN_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { orderId: true, snapToken: true },
  });
  if (pending?.snapToken) return { ok: true, orderId: pending.orderId, snapToken: pending.snapToken };

  // Save the order before calling Midtrans, so a webhook for it always finds a row.
  const orderId = `PREMIUM-${randomUUID()}`;
  await prisma.payment.create({ data: { userId: user.id, orderId, amount: premiumPlan.priceIdr } });

  let token: string;
  try {
    ({ token } = await createSnapTransaction({
      orderId,
      amount: premiumPlan.priceIdr,
      itemName: `${premiumPlan.name} (sekali bayar)`,
      customer: { name: user.name, email: user.email },
      finishUrl: `${process.env.BETTER_AUTH_URL}/premium/finish`,
    }));
  } catch (error) {
    // Log the details on the server; the user only sees a generic message.
    console.error("Midtrans checkout failed", error);
    await prisma.payment.update({ where: { orderId }, data: { status: "FAILED" } });
    return { ok: false, error: "unavailable" };
  }

  await prisma.payment.update({ where: { orderId }, data: { snapToken: token } });
  return { ok: true, orderId, snapToken: token };
}
