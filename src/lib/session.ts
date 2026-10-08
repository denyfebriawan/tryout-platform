// Data Access Layer for auth: the only place that reads the session.
// Pages, Server Actions and route handlers call these helpers instead of touching cookies directly.
import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isPremium: boolean;
};

// cache() dedupes calls within one request: the header and the page can both ask for the user,
// and the session is only looked up once.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Return a narrow object so nothing else from the session leaks into components by accident.
  const { id, name, email, role, isPremium } = session.user;
  return { id, name, email, role: role as Role, isPremium };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Non-admins get a 404 rather than a "forbidden" page, so the admin area doesn't reveal it exists.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
