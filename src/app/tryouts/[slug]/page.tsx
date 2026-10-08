import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SubmitButton } from "@/components/submit-button";
import { TryoutBadges } from "@/components/tryout-badges";
import type { AccessTier } from "@/generated/prisma/client";
import { canAccessTryout } from "@/lib/access";
import { startAttempt } from "@/lib/attempt-actions";
import { formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Detail Tryout" };

export default function TryoutDetailPage({ params }: PageProps<"/tryouts/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      {/* params are only known at request time, so the part that reads them streams in. */}
      <Suspense fallback={<p className="text-zinc-500">Memuat tryout...</p>}>
        <TryoutDetail params={params} />
      </Suspense>
    </main>
  );
}

async function TryoutDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tryout = await prisma.tryout.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      examType: true,
      accessTier: true,
      subtests: {
        orderBy: { order: "asc" },
        select: { id: true, code: true, name: true, durationSeconds: true, _count: { select: { questions: true } } },
      },
    },
  });
  if (!tryout) notFound();

  const totalSeconds = tryout.subtests.reduce((sum, subtest) => sum + subtest.durationSeconds, 0);
  const totalQuestions = tryout.subtests.reduce((sum, subtest) => sum + subtest._count.questions, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
        <h1 className="text-2xl font-semibold">{tryout.title}</h1>
        {tryout.description && <p className="text-zinc-600">{tryout.description}</p>}
        <Link href={`/tryouts/${slug}/leaderboard`} className="self-start text-sm font-medium text-indigo-600 hover:underline">
          Lihat leaderboard
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subtes</th>
              <th className="px-4 py-2 text-right font-medium">Soal</th>
              <th className="px-4 py-2 text-right font-medium">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tryout.subtests.map((subtest) => (
              <tr key={subtest.id}>
                <td className="px-4 py-2">
                  <span className="mr-2 font-mono text-xs text-zinc-400">{subtest.code}</span>
                  {subtest.name}
                </td>
                <td className="px-4 py-2 text-right">{subtest._count.questions}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">{formatDuration(subtest.durationSeconds)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 font-medium">
            <tr>
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right">{totalQuestions}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap">{formatDuration(totalSeconds)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        <h2 className="mb-2 font-medium text-zinc-900">Aturan pengerjaan</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Setiap subtes punya waktu sendiri dan dikerjakan berurutan.</li>
          <li>Subtes yang sudah selesai tidak bisa dibuka lagi.</li>
          <li>Waktu tetap berjalan walaupun kamu menutup halaman.</li>
          <li>Jawaban tersimpan otomatis setiap kali kamu memilih.</li>
          <li>Saat waktu habis, jawaban dikumpulkan otomatis.</li>
        </ul>
      </section>

      <StartPanel tryoutId={tryout.id} accessTier={tryout.accessTier} />
    </div>
  );
}

// The only part that depends on who is looking: sign-in prompt, start, resume, done, or locked.
async function StartPanel({ tryoutId, accessTier }: { tryoutId: string; accessTier: AccessTier }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="self-start rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
        Masuk untuk mulai
      </Link>
    );
  }

  const attempt = await prisma.attempt.findUnique({
    where: { userId_tryoutId: { userId: user.id, tryoutId } },
    select: { id: true, status: true },
  });

  if (attempt) {
    return (
      <Link
        href={`/attempts/${attempt.id}`}
        className="self-start rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
      >
        {attempt.status === "IN_PROGRESS" ? "Lanjutkan tryout" : "Lihat hasil dan pembahasan"}
      </Link>
    );
  }

  // This only decides what to show. startAttempt runs the same check on the server.
  if (!canAccessTryout(user, { accessTier })) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div>
          <h2 className="font-medium text-amber-900">Tryout ini khusus Premium</h2>
          <p className="text-sm text-amber-800">
            Akun gratis bisa mengerjakan tryout gratis. Upgrade ke Premium untuk membuka semua tryout.
          </p>
        </div>
        <Link href="/premium" className="rounded-md bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600">
          Upgrade ke Premium
        </Link>
      </section>
    );
  }

  // A plain form posting to a Server Action, with the tryout id in a hidden field.
  return (
    <form action={startAttempt} className="flex flex-col items-start gap-2">
      <input type="hidden" name="tryoutId" value={tryoutId} />
      <SubmitButton pendingText="Menyiapkan...">Mulai tryout</SubmitButton>
      <p className="text-xs text-zinc-500">Timer subtes pertama langsung berjalan setelah kamu menekan tombol ini.</p>
    </form>
  );
}
