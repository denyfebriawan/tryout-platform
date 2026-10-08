import { describe, expect, it } from "vitest";

import { canAccessTryout } from "./access";

describe("canAccessTryout", () => {
  it("opens free tryouts to every user", () => {
    expect(canAccessTryout({ isPremium: false }, { accessTier: "FREE" })).toBe(true);
    expect(canAccessTryout({ isPremium: true }, { accessTier: "FREE" })).toBe(true);
  });

  it("opens premium tryouts to premium users only", () => {
    expect(canAccessTryout({ isPremium: false }, { accessTier: "PREMIUM" })).toBe(false);
    expect(canAccessTryout({ isPremium: true }, { accessTier: "PREMIUM" })).toBe(true);
  });
});
