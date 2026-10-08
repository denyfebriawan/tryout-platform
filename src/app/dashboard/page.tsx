import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

// The page shell is static. The part that needs the session streams in behind Suspense.
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat dashboard...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  // Redirects to /login when signed out. This check runs on every request to this page.
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Halo, {user.name}</h1>
        <p className="text-zinc-500">{user.email}</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 font-medium">Paket kamu</h2>
        {user.isPremium ? (
          <p className="text-zinc-600">Premium: semua tryout terbuka.</p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="text-zinc-600">Gratis: tryout gratis saja. Upgrade ke Premium untuk membuka semua tryout.</p>
            <Link href="/premium" className="text-sm font-medium text-amber-700 hover:underline">
              Upgrade ke Premium
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 font-medium">Riwayat tryout</h2>
        <p className="mb-3 text-zinc-500">Belum ada tryout yang kamu kerjakan.</p>
        <Link href="/tryouts" className="text-sm font-medium text-indigo-600 hover:underline">
          Lihat daftar tryout
        </Link>
      </section>
    </div>
  );
}
