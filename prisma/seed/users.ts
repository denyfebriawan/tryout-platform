import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import type { PrismaClient } from "../../src/generated/prisma/client";
import { demoAccounts } from "../../src/lib/demo-accounts";

// Creates or refreshes the demo logins. Mirrors what Better Auth's email sign-up does:
// a User row plus a "credential" Account row holding the password hash.
export async function seedDemoUsers(prisma: PrismaClient) {
  for (const account of demoAccounts) {
    const passwordHash = await hashPassword(account.password);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, isPremium: account.isPremium },
      create: {
        id: randomUUID(),
        name: account.name,
        email: account.email,
        emailVerified: true,
        role: account.role,
        isPremium: account.isPremium,
      },
    });

    const credential = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (credential) {
      await prisma.account.update({ where: { id: credential.id }, data: { password: passwordHash } });
    } else {
      await prisma.account.create({
        data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: passwordHash },
      });
    }

    console.log(`Demo user ${account.email} (${account.role}${account.isPremium ? ", premium" : ""})`);
  }
}
