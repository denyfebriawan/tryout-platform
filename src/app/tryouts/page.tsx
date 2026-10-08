import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TryoutBadges } from "@/components/tryout-badges";
import { canAccessTryout } from "@/lib/access";
import { formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Daftar Tryout" };

const STATUS_LABEL = {
  IN_PROGRESS: { text: "Sedang dikerjakan", className: "text-amber-700" },
  SUBMITTED: { text: "Selesai", className: "text-emerald-700" },
} as const;

export default function TryoutsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Daftar Tryout</h1>
      <p className="mb-6 text-zinc-500">Pilih tryout untuk melihat detail subtes dan mulai mengerjakan.</p>
      <Suspense fallback={<p className="text-zinc-500">Memuat tryout...</p>}>
        <TryoutList />
      </Suspense>
    </main>
  );
}

// The catalog is public. A signed-in user also sees their status on each tryout.
async function TryoutList() {
  const user = await getCurrentUser();
  const [tryouts, attempts] = await Promise.all([
    prisma.tryout.findMany({
      where: { isPublished: true },
      // FREE sorts before PREMIUM (Postgres orders enums by declaration order).
      orderBy: [{ accessTier: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        examType: true,
        accessTier: true,
        subtests: { select: { durationSeconds: true, _count: { select: { questions: true } } } },
      },
    }),
    user ? prisma.attempt.findMany({ where: { userId: user.id }, select: { tryoutId: true, status: true } }) : [],
  ]);

  const statusByTryout = new Map(attempts.map((attempt) => [attempt.tryoutId, attempt.status]));

  if (tryouts.length === 0) return <p className="text-zinc-500">Belum ada tryout yang tersedia.</p>;

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {tryouts.map((tryout) => {
        const questionCount = tryout.subtests.reduce((sum, subtest) => sum + subtest._count.questions, 0);
        const totalSeconds = tryout.subtests.reduce((sum, subtest) => sum + subtest.durationSeconds, 0);
        const status = statusByTryout.get(tryout.id);
        const locked = user !== null && !status && !canAccessTryout(user, tryout);
        return (
          <li key={tryout.id}>
            <Link
              href={`/tryouts/${tryout.slug}`}
              className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm"
            >
              <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
              <div>
                <h2 className="font-semibold">{tryout.title}</h2>
                {tryout.description && <p className="mt-1 text-sm text-zinc-600">{tryout.description}</p>}
              </div>
              <p className="mt-auto text-sm text-zinc-500">
                {tryout.subtests.length} subtes · {questionCount} soal · {formatDuration(totalSeconds)}
              </p>
              {status && (
                <p className={`text-sm font-medium ${STATUS_LABEL[status].className}`}>{STATUS_LABEL[status].text}</p>
              )}
              {locked && <p className="text-sm font-medium text-amber-700">Terkunci · upgrade ke Premium</p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
