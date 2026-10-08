import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/session";
import { siteConfig } from "@/lib/site";

// The header itself is static and prerendered. Only UserNav reads the session,
// so it sits behind its own Suspense boundary and streams in per request.
export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">
            {siteConfig.name}
          </Link>
          <Link href="/tryouts" className="text-sm text-zinc-700 hover:text-indigo-600">
            Tryout
          </Link>
        </div>
        <Suspense fallback={<div className="h-8 w-32 animate-pulse rounded bg-zinc-100" />}>
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/login" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">
          Masuk
        </Link>
        <Link href="/register" className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
          Daftar
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link
        href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
        className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
      >
        {user.role === "ADMIN" ? "Admin" : "Dashboard"}
      </Link>
      <span className="hidden text-zinc-500 sm:inline">{user.name}</span>
      {user.isPremium && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Premium</span>
      )}
      {/* A plain form posting to a Server Action: sign-out works even before JavaScript loads. */}
      <form action={signOut}>
        <button type="submit" className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">
          Keluar
        </button>
      </form>
    </nav>
  );
}
