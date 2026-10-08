import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // input: false means the sign-up form can't set these. Only our server code can.
      role: { type: "string", defaultValue: "PARTICIPANT", input: false },
      isPremium: { type: "boolean", defaultValue: false, input: false },
    },
  },
  // No session cookie cache on purpose: every getSession reads the user from the database,
  // so a premium upgrade from the payment webhook takes effect on the very next request.
  plugins: [
    // Lets Better Auth set cookies when it's called from a Server Action. Must stay last.
    nextCookies(),
  ],
});
