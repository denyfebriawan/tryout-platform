import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PayButton } from "@/components/pay-button";
import { formatRupiah } from "@/lib/format";
import { getSnapClientConfig, isMidtransConfigured } from "@/lib/midtrans";
import { premiumPlan } from "@/lib/premium-plan";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Upgrade ke Premium" };

// The plan details are the same for everyone, so they stay in the static shell.
// Only the action at the bottom depends on who is looking.
export default function PremiumPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Upgrade ke Premium</h1>
      <p className="mb-6 text-zinc-500">Akun gratis bisa mengerjakan tryout gratis. Premium membuka semuanya.</p>

      <section className="flex flex-col gap-5 rounded-xl border border-amber-200 bg-white p-6">
        <div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{premiumPlan.name}</span>
          <p className="mt-3 text-3xl font-bold">{formatRupiah(premiumPlan.priceIdr)}</p>
          <p className="text-sm text-zinc-500">sekali bayar</p>
        </div>
        <ul className="space-y-2 text-sm text-zinc-700">
          {premiumPlan.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <span className="text-emerald-600">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
        <Suspense fallback={<div className="h-11 w-48 animate-pulse rounded-md bg-zinc-100" />}>
          <UpgradeAction />
        </Suspense>
      </section>
    </main>
  );
}

async function UpgradeAction() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="self-start rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
        Masuk untuk upgrade
      </Link>
    );
  }

  if (user.isPremium) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="font-medium text-emerald-700">Akun kamu sudah Premium. Semua tryout terbuka.</p>
        <Link href="/tryouts" className="text-sm font-medium text-indigo-600 hover:underline">
          Lihat daftar tryout
        </Link>
      </div>
    );
  }

  if (!isMidtransConfigured()) {
    return <p className="text-sm text-zinc-500">Pembayaran belum dikonfigurasi di server ini.</p>;
  }

  const { scriptUrl, clientKey } = getSnapClientConfig();
  return <PayButton scriptUrl={scriptUrl} clientKey={clientKey} />;
}
