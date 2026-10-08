import Link from "next/link";

import type { AttemptWithSections } from "@/lib/attempts";
import { formatDateTime, formatScore } from "@/lib/format";
import { getRank } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { SCORE_SCALE } from "@/lib/scoring";

type Status = "correct" | "wrong" | "unanswered";

const STATUS_BADGE: Record<Status, { text: string; className: string }> = {
  correct: { text: "Benar", className: "bg-emerald-50 text-emerald-700" },
  wrong: { text: "Salah", className: "bg-red-50 text-red-700" },
  unanswered: { text: "Tidak dijawab", className: "bg-zinc-100 text-zinc-600" },
};

// The results page: scores, rank, and the full review with answer keys and explanations.
// The caller only renders this for a SUBMITTED attempt, which is what makes showing the key safe.
export async function AttemptResults({ attempt }: { attempt: AttemptWithSections }) {
  const [questions, answers, rank] = await Promise.all([
    prisma.question.findMany({
      where: { subtestId: { in: attempt.sections.map((section) => section.subtestId) } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        subtestId: true,
        stimulus: true,
        stem: true,
        explanation: true,
        options: { orderBy: { label: "asc" }, select: { id: true, label: true, text: true, isCorrect: true } },
      },
    }),
    prisma.attemptAnswer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedOptionId: true, isCorrect: true },
    }),
    attempt.score === null ? null : getRank(attempt.tryoutId, attempt.score),
  ]);

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  // Right or wrong comes from what was stored at scoring time, so it always agrees with the score.
  const statusOf = (questionId: string): Status => {
    const answer = answerByQuestion.get(questionId);
    if (!answer?.selectedOptionId) return "unanswered";
    return answer.isCorrect ? "correct" : "wrong";
  };

  const sections = attempt.sections.map((section) => {
    const inSubtest = questions.filter((question) => question.subtestId === section.subtestId);
    const statuses = inSubtest.map((question) => statusOf(question.id));
    return {
      ...section,
      questions: inSubtest,
      correct: statuses.filter((status) => status === "correct").length,
      wrong: statuses.filter((status) => status === "wrong").length,
      unanswered: statuses.filter((status) => status === "unanswered").length,
    };
  });

  const scale = SCORE_SCALE[attempt.tryout.examType];
  const leaderboardHref = `/tryouts/${attempt.tryout.slug}/leaderboard`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <div>
        <p className="text-sm text-zinc-500">{attempt.tryout.title}</p>
        <h1 className="text-2xl font-semibold">Hasil Tryout</h1>
        {attempt.submittedAt && (
          <p className="mt-1 text-zinc-600">
            Dikumpulkan {formatDateTime(attempt.submittedAt)}
            {attempt.autoSubmitted && " (otomatis, waktu habis)"}.
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Skor total</p>
          {attempt.score === null ? (
            <p className="mt-1 text-zinc-600">Skor belum tersedia.</p>
          ) : (
            <p className="mt-1 text-4xl font-bold text-indigo-600">
              {formatScore(attempt.score)}
              <span className="ml-1 text-base font-normal text-zinc-400">/ {scale}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-500">Rata-rata skor semua subtes.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Peringkat</p>
          {rank ? (
            <p className="mt-1 text-4xl font-bold">
              #{rank.rank}
              <span className="ml-1 text-base font-normal text-zinc-400">dari {rank.total} peserta</span>
            </p>
          ) : (
            <p className="mt-1 text-zinc-600">Belum ada peringkat.</p>
          )}
          <Link href={leaderboardHref} className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Lihat leaderboard
          </Link>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subtes</th>
              <th className="px-3 py-2 text-right font-medium">Benar</th>
              <th className="px-3 py-2 text-right font-medium">Salah</th>
              <th className="px-3 py-2 text-right font-medium">Kosong</th>
              <th className="px-4 py-2 text-right font-medium">Skor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sections.map((section) => (
              <tr key={section.id}>
                <td className="px-4 py-2">
                  <span className="mr-2 font-mono text-xs text-zinc-400">{section.subtest.code}</span>
                  {section.subtest.name}
                </td>
                <td className="px-3 py-2 text-right text-emerald-700">{section.correct}</td>
                <td className="px-3 py-2 text-right text-red-700">{section.wrong}</td>
                <td className="px-3 py-2 text-right text-zinc-500">{section.unanswered}</td>
                <td className="px-4 py-2 text-right font-medium">{section.score === null ? "-" : formatScore(section.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Pembahasan</h2>
        {/* <details> gives collapsible sections with no client JavaScript. */}
        {sections.map((section) => (
          <details key={section.id} className="rounded-xl border border-zinc-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 font-medium">
              <span>
                <span className="mr-2 font-mono text-xs text-zinc-400">{section.subtest.code}</span>
                {section.subtest.name}
              </span>
              <span className="text-sm font-normal text-zinc-500">
                {section.correct}/{section.questions.length} benar
              </span>
            </summary>
            <ol className="flex flex-col divide-y divide-zinc-100 border-t border-zinc-100">
              {section.questions.map((question, index) => {
                const status = statusOf(question.id);
                const selectedId = answerByQuestion.get(question.id)?.selectedOptionId ?? null;
                return (
                  <li key={question.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Soal {index + 1}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status].className}`}>
                        {STATUS_BADGE[status].text}
                      </span>
                    </div>
                    {question.stimulus && (
                      <div className="rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed whitespace-pre-line text-zinc-700">
                        {question.stimulus}
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-line">{question.stem}</p>
                    <ul className="flex flex-col gap-2">
                      {question.options.map((option) => (
                        <ReviewOption key={option.id} option={option} selected={option.id === selectedId} />
                      ))}
                    </ul>
                    {question.explanation && (
                      <div className="rounded-lg bg-indigo-50 p-4 text-sm leading-relaxed text-zinc-700">
                        <p className="mb-1 font-medium text-indigo-900">Pembahasan</p>
                        <p className="whitespace-pre-line">{question.explanation}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </details>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/tryouts" className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium hover:bg-zinc-100">
          Kembali ke daftar tryout
        </Link>
        <Link href={leaderboardHref} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Lihat leaderboard
        </Link>
      </div>
    </div>
  );
}

// One option in the review: the key is green, a wrong pick is red, everything else is neutral.
function ReviewOption({
  option,
  selected,
}: {
  option: { label: string; text: string; isCorrect: boolean };
  selected: boolean;
}) {
  let tone = "border-zinc-200";
  let circle = "border-zinc-300 text-zinc-600";
  if (option.isCorrect) {
    tone = "border-emerald-400 bg-emerald-50";
    circle = "border-emerald-600 bg-emerald-600 text-white";
  } else if (selected) {
    tone = "border-red-300 bg-red-50";
    circle = "border-red-600 bg-red-600 text-white";
  }

  return (
    <li className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${tone}`}>
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${circle}`}>
        {option.label}
      </span>
      <span className="flex-1 pt-0.5 whitespace-pre-line">{option.text}</span>
      <span className="shrink-0 pt-1 text-xs font-medium text-zinc-500">
        {[selected && "Jawaban kamu", option.isCorrect && "Kunci"].filter(Boolean).join(" · ")}
      </span>
    </li>
  );
}
