import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TryoutBadges } from "@/components/tryout-badges";
import { formatDuration, formatScore } from "@/lib/format";
import { getLeaderboard, getRank, LEADERBOARD_SIZE } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { SCORE_SCALE } from "@/lib/scoring";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage({ params }: PageProps<"/tryouts/[slug]/leaderboard">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat leaderboard...</p>}>
        <LeaderboardContent params={params} />
      </Suspense>
    </main>
  );
}

// Signed-in users only: the leaderboard lists other participants' names.
async function LeaderboardContent({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const tryout = await prisma.tryout.findFirst({
    where: { slug, isPublished: true },
    select: { id: true, slug: true, title: true, examType: true, accessTier: true },
  });
  if (!tryout) notFound();

  const [entries, mine] = await Promise.all([
    getLeaderboard(tryout.id),
    prisma.attempt.findUnique({
      where: { userId_tryoutId: { userId: user.id, tryoutId: tryout.id } },
      select: { id: true, status: true, score: true, startedAt: true, submittedAt: true },
    }),
  ]);

  // If the participant is ranked but outside the top list, show their own row below it.
  const inList = entries.some((entry) => entry.userId === user.id);
  const myRow =
    mine?.status === "SUBMITTED" && mine.score !== null && !inList
      ? { ...mine, score: mine.score, rank: (await getRank(tryout.id, mine.score)).rank }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-zinc-600">{tryout.title}</p>
        <p className="text-sm text-zinc-500">
          Skor 0–{SCORE_SCALE[tryout.examType]}, rata-rata semua subtes. Skor sama mendapat peringkat yang sama.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-500">Belum ada peserta yang menyelesaikan tryout ini.</p>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="w-16 px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Peserta</th>
                <th className="px-4 py-2 text-right font-medium">Waktu</th>
                <th className="px-4 py-2 text-right font-medium">Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entries.map((entry) => (
                <Row
                  key={entry.id}
                  rank={entry.rank}
                  name={entry.user.name}
                  isMe={entry.userId === user.id}
                  score={entry.score}
                  startedAt={entry.startedAt}
                  submittedAt={entry.submittedAt}
                />
              ))}
              {myRow && (
                <>
                  <tr>
                    <td colSpan={4} className="px-4 py-1 text-center text-zinc-400">
                      ⋯
                    </td>
                  </tr>
                  <Row
                    rank={myRow.rank}
                    name={user.name}
                    isMe
                    score={myRow.score}
                    startedAt={myRow.startedAt}
                    submittedAt={myRow.submittedAt}
                  />
                </>
              )}
            </tbody>
          </table>
          <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
            Menampilkan {LEADERBOARD_SIZE} peringkat teratas.
          </p>
        </section>
      )}

      <MyStatus attempt={mine} slug={tryout.slug} />
    </div>
  );
}

function Row({
  rank,
  name,
  isMe,
  score,
  startedAt,
  submittedAt,
}: {
  rank: number;
  name: string;
  isMe: boolean;
  score: number;
  startedAt: Date;
  submittedAt: Date | null;
}) {
  const seconds = submittedAt ? Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000) : null;
  return (
    <tr className={isMe ? "bg-indigo-50 font-medium" : undefined}>
      <td className="px-4 py-2">{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}</td>
      <td className="px-4 py-2">
        {name}
        {isMe && <span className="ml-2 text-xs text-indigo-600">(kamu)</span>}
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap text-zinc-500">
        {seconds === null ? "-" : formatDuration(seconds)}
      </td>
      <td className="px-4 py-2 text-right font-medium">{formatScore(score)}</td>
    </tr>
  );
}

// What the signed-in participant can do next on this tryout.
function MyStatus({ attempt, slug }: { attempt: { id: string; status: string } | null; slug: string }) {
  if (attempt?.status === "SUBMITTED") {
    return (
      <Link href={`/attempts/${attempt.id}`} className="self-start text-sm font-medium text-indigo-600 hover:underline">
        Lihat hasil dan pembahasan kamu
      </Link>
    );
  }
  return (
    <p className="text-sm text-zinc-600">
      {attempt ? "Kamu sedang mengerjakan tryout ini. " : "Kamu belum mengerjakan tryout ini. "}
      <Link href={attempt ? `/attempts/${attempt.id}` : `/tryouts/${slug}`} className="font-medium text-indigo-600 hover:underline">
        {attempt ? "Lanjutkan" : "Mulai sekarang"}
      </Link>
    </p>
  );
}
