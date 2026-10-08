// Premium gating, in one place. Pure so it can be unit tested and shared by pages and Server Actions.
// Pages call it to decide what to show; startAttempt calls it to decide what is allowed.
import type { AccessTier } from "@/generated/prisma/client";

// Free tryouts are open to every signed-in user. Premium tryouts need a premium account.
export function canAccessTryout(user: { isPremium: boolean }, tryout: { accessTier: AccessTier }): boolean {
  return tryout.accessTier === "FREE" || user.isPremium;
}
