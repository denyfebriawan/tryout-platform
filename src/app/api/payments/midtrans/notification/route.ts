// Midtrans payment notification (webhook). Set this URL in the Midtrans dashboard:
// Settings → Payment → Notification URL → https://<your-domain>/api/payments/midtrans/notification
//
// There is no session here: Midtrans's servers call it, not the user's browser. The signature check
// is what makes it safe to expose publicly.
import { getServerKey } from "@/lib/midtrans";
import { hasValidSignature, parseNotification } from "@/lib/midtrans-notification";
import { applyNotification } from "@/lib/payments";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const notification = parseNotification(body);
  if (!notification) return Response.json({ error: "invalid notification" }, { status: 400 });
  if (!hasValidSignature(notification, getServerKey())) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const result = await applyNotification(notification, body);

  // Midtrans retries notifications that don't get a 2xx response, so only real problems return an error.
  // A repeated notification ("unchanged") is a success: it was already handled.
  switch (result) {
    case "updated":
    case "unchanged":
      return Response.json({ ok: true });
    case "unknown-order":
      return Response.json({ error: "unknown order" }, { status: 404 });
    case "amount-mismatch":
      console.error("Midtrans notification amount mismatch", notification.order_id, notification.gross_amount);
      return Response.json({ error: "amount mismatch" }, { status: 400 });
  }
}
