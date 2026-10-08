import { describe, expect, it } from "vitest";

import {
  hasValidSignature,
  midtransSignature,
  nextPaymentStatus,
  parseNotification,
  statusFromNotification,
} from "./midtrans-notification";

const serverKey = "SB-Mid-server-test-key";

function notification(overrides: Record<string, unknown> = {}) {
  const base = { order_id: "PREMIUM-1", status_code: "200", gross_amount: "49000.00", transaction_status: "settlement" };
  const signed = { ...base, ...overrides };
  return { ...signed, signature_key: midtransSignature(signed as typeof base, serverKey) };
}

describe("parseNotification", () => {
  it("accepts a body with the required string fields", () => {
    const parsed = parseNotification({ ...notification(), payment_type: "bank_transfer", extra: 1 });
    expect(parsed?.order_id).toBe("PREMIUM-1");
    expect(parsed?.payment_type).toBe("bank_transfer");
  });

  it("rejects bodies with missing or non-string fields", () => {
    expect(parseNotification(null)).toBeNull();
    expect(parseNotification("settlement")).toBeNull();
    expect(parseNotification({ ...notification(), order_id: 123 })).toBeNull();
    expect(parseNotification({ ...notification(), signature_key: undefined })).toBeNull();
  });
});

describe("hasValidSignature", () => {
  it("accepts a notification signed with the server key", () => {
    expect(hasValidSignature(parseNotification(notification())!, serverKey)).toBe(true);
  });

  it("rejects a wrong key or a tampered field", () => {
    const signed = parseNotification(notification())!;
    expect(hasValidSignature(signed, "another-key")).toBe(false);
    expect(hasValidSignature({ ...signed, gross_amount: "1.00" }, serverKey)).toBe(false);
    expect(hasValidSignature({ ...signed, signature_key: "short" }, serverKey)).toBe(false);
  });
});

describe("statusFromNotification", () => {
  it("maps Midtrans statuses to payment statuses", () => {
    expect(statusFromNotification("settlement")).toBe("PAID");
    expect(statusFromNotification("pending")).toBe("PENDING");
    expect(statusFromNotification("deny")).toBe("FAILED");
    expect(statusFromNotification("cancel")).toBe("FAILED");
    expect(statusFromNotification("failure")).toBe("FAILED");
    expect(statusFromNotification("expire")).toBe("EXPIRED");
  });

  it("only treats a card capture as paid when the fraud check accepted it", () => {
    expect(statusFromNotification("capture", "accept")).toBe("PAID");
    expect(statusFromNotification("capture", "challenge")).toBe("PENDING");
    expect(statusFromNotification("capture", "deny")).toBe("FAILED");
  });

  it("ignores statuses the demo doesn't handle", () => {
    expect(statusFromNotification("refund")).toBeNull();
    expect(statusFromNotification("authorize")).toBeNull();
  });
});

describe("nextPaymentStatus", () => {
  it("moves a pending payment to its final status", () => {
    expect(nextPaymentStatus("PENDING", "PAID")).toBe("PAID");
    expect(nextPaymentStatus("PENDING", "EXPIRED")).toBe("EXPIRED");
    expect(nextPaymentStatus("PENDING", "FAILED")).toBe("FAILED");
  });

  it("never changes a paid payment, so repeated or late notifications are harmless", () => {
    expect(nextPaymentStatus("PAID", "PAID")).toBeNull();
    expect(nextPaymentStatus("PAID", "EXPIRED")).toBeNull();
    expect(nextPaymentStatus("PAID", "PENDING")).toBeNull();
  });

  it("lets a failed or expired payment turn paid, but not back to pending", () => {
    expect(nextPaymentStatus("EXPIRED", "PAID")).toBe("PAID");
    expect(nextPaymentStatus("FAILED", "PAID")).toBe("PAID");
    expect(nextPaymentStatus("EXPIRED", "PENDING")).toBeNull();
    expect(nextPaymentStatus("PENDING", "PENDING")).toBeNull();
  });
});
