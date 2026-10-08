import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TryoutBadges } from "@/components/tryout-badges";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { PublishBadge } from "./_components/admin-chrome";

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

  const [tryouts, participants] = await Promise.all([
    prisma.tryout.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        examType: true,
        accessTier: true,
        isPublished: true,
        _count: { select: { attempts: true } },
        subtests: { select: { _count: { select: { questions: true } } } },
      },
    }),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
  ]);

  const rows = tryouts.map((tryout) => ({
    ...tryout,
    questionCount: tryout.subtests.reduce((sum, subtest) => sum + subtest._count.questions, 0),
  }));

  const stats = [
    { label: "Tryout", value: tryouts.length },
    { label: "Soal", value: rows.reduce((sum, row) => sum + row.questionCount, 0) },
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tryout</h2>
          <Link
            href="/admin/tryouts/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tryout baru
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-zinc-500">Belum ada tryout.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Judul</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Subtes</th>
                  <th className="px-4 py-2 text-right font-medium">Soal</th>
                  <th className="px-4 py-2 text-right font-medium">Dikerjakan</th>
                  <th className="px-4 py-2">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((tryout) => (
                  <tr key={tryout.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tryouts/${tryout.id}`}
                        className="font-medium text-indigo-700 underline-offset-2 hover:underline"
                      >
                        {tryout.title}
                      </Link>
                      <div className="mt-1">
                        <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PublishBadge isPublished={tryout.isPublished} />
                    </td>
                    <td className="px-4 py-3 text-right">{tryout.subtests.length}</td>
                    <td className="px-4 py-3 text-right">{tryout.questionCount}</td>
                    <td className="px-4 py-3 text-right">
                      {tryout._count.attempts}
                      {tryout._count.attempts > 0 && (
                        <span className="ml-1 text-xs text-amber-700" title="Struktur dikunci">
                          · terkunci
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/tryouts/${tryout.id}`}
                        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-50"
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
