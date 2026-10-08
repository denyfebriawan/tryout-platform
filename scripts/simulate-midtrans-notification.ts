// Sends a correctly signed Midtrans notification to the local webhook, for testing without a public URL
// (Midtrans can't reach localhost). Signed with your sandbox server key from .env.local.
//
//   npm run payment:notify -- <order_id> [settlement|pending|expire|cancel|deny]
//
// The order id is shown on /premium/finish after you open the Snap popup.
import { config } from "dotenv";

import { midtransSignature } from "../src/lib/midtrans-notification";
import { premiumPlan } from "../src/lib/premium-plan";

config({ path: ".env.local" });

// The status_code Midtrans sends with each transaction_status.
const STATUS_CODES: Record<string, string> = {
  settlement: "200",
  pending: "201",
  deny: "202",
  cancel: "200",
  expire: "407",
};

async function main() {
  const [orderId, transactionStatus = "settlement"] = process.argv.slice(2);
  const statusCode = STATUS_CODES[transactionStatus];
  if (!orderId || !statusCode) {
    console.error("Usage: npm run payment:notify -- <order_id> [settlement|pending|expire|cancel|deny]");
    process.exit(1);
  }
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not set in .env.local");

  const notification = {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: `${premiumPlan.priceIdr}.00`,
    transaction_status: transactionStatus,
    transaction_id: `simulated-${Date.now()}`,
    payment_type: "bank_transfer",
  };
  const body = { ...notification, signature_key: midtransSignature(notification, serverKey) };

  const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/payments/midtrans/notification`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(response.status, await response.text());
}

main();
