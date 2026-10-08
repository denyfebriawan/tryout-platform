// Midtrans Snap client: config from env plus the one API call we need (create a transaction).
// Plain fetch instead of the midtrans-client SDK: it's a single authenticated POST, and the SDK
// is CommonJS without TypeScript types.
import "server-only";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const snapBaseUrl = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

export function getServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY is not set");
  return key;
}

// Lets pages show "payment unavailable" instead of crashing when the keys aren't set (e.g. a fresh clone).
export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
}

// What the browser needs to open the Snap popup. The client key is public by design.
export function getSnapClientConfig() {
  return {
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    scriptUrl: `${snapBaseUrl}/snap/snap.js`,
  };
}

type CreateTransactionInput = {
  orderId: string;
  amount: number;
  itemName: string;
  customer: { name: string; email: string };
  finishUrl: string;
};

// Creates a Snap transaction and returns its token, which the browser uses to open the payment popup.
export async function createSnapTransaction(input: CreateTransactionInput): Promise<{ token: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    // Basic auth with the server key as the username and an empty password.
    Authorization: `Basic ${Buffer.from(`${getServerKey()}:`).toString("base64")}`,
  };
  // Optional: send this transaction's webhook somewhere other than the URL set in the Midtrans
  // dashboard, e.g. a tunnel to localhost during development.
  if (process.env.MIDTRANS_NOTIFICATION_URL) {
    headers["X-Override-Notification"] = process.env.MIDTRANS_NOTIFICATION_URL;
  }

  const response = await fetch(`${snapBaseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [{ id: "premium", name: input.itemName, price: input.amount, quantity: 1 }],
      customer_details: { first_name: input.customer.name, email: input.customer.email },
      // Where Midtrans sends the user after paying in redirect mode (e.g. e-wallet apps on mobile).
      callbacks: { finish: input.finishUrl },
    }),
  });

  if (!response.ok) {
    throw new Error(`Midtrans Snap returned ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as { token: string };
  return { token: data.token };
}
