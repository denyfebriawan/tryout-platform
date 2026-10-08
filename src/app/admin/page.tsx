import type { Metadata } from "next";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  // The role check lives in the page, not in a layout: layouts don't re-run when you navigate
  // between pages inside them, so a layout-only check could be skipped.
  await requireAdmin();

  const [tryouts, questions, participants] = await Promise.all([
    prisma.tryout.count(),
    prisma.question.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
  ]);

  const stats = [
    { label: "Tryout", value: tryouts },
    { label: "Soal", value: questions },
    { label: "Peserta", value: participants },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
