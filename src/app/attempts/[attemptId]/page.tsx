import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { type AttemptWithSections, findAttemptForUser, getExamQuestions, getSavedAnswers, timelineOf } from "@/lib/attempts";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

import { ExamRoom } from "./exam-room";
import { TimeUp } from "./time-up";

export const metadata: Metadata = { title: "Mengerjakan Tryout" };

export default function AttemptPage({ params }: PageProps<"/attempts/[attemptId]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10">
      <Suspense fallback={<p className="py-6 text-zinc-500">Memuat soal...</p>}>
        <AttemptContent params={params} />
      </Suspense>
    </main>
  );
}

async function AttemptContent({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser();
  const { attemptId } = await params;
  // Someone else's attempt id gives the same 404 as one that doesn't exist.
  const attempt = await findAttemptForUser(attemptId, user.id);
  if (!attempt) notFound();

  if (attempt.status === "SUBMITTED") return <SubmittedSummary attempt={attempt} />;

  // Reading the clock is allowed here because this component already read the request (the session).
  const now = new Date();
  const timeline = timelineOf(attempt, now);
  const activeIndex = timeline.sections.findIndex((section) => section.state === "active");

  // Every section ran out while the participant was away. The client asks the server to close them.
  if (activeIndex === -1) return <TimeUp attemptId={attempt.id} />;

  const section = attempt.sections[activeIndex];
  const [questions, answers] = await Promise.all([
    getExamQuestions(section.subtestId),
    getSavedAnswers(attempt.id, section.subtestId),
  ]);

  return (
    <ExamRoom
      // A new section gets a fresh ExamRoom (question 1, empty state) instead of reusing the old one.
      key={section.id}
      attemptId={attempt.id}
      tryoutTitle={attempt.tryout.title}
      section={{
        id: section.id,
        code: section.subtest.code,
        name: section.subtest.name,
        number: activeIndex + 1,
        total: attempt.sections.length,
      }}
      deadlineMs={timeline.sections[activeIndex].deadline.getTime()}
      serverNowMs={now.getTime()}
      questions={questions}
      initialAnswers={answers}
    />
  );
}

// Shown once the attempt is submitted. Milestone 5 replaces this with scores and explanations.
async function SubmittedSummary({ attempt }: { attempt: AttemptWithSections }) {
  // Each question with the participant's answer to it, if they picked an option.
  const questions = await prisma.question.findMany({
    where: { subtestId: { in: attempt.sections.map((section) => section.subtestId) } },
    select: {
      subtestId: true,
      answers: { where: { attemptId: attempt.id, selectedOptionId: { not: null } }, select: { id: true } },
    },
  });

  const rows = attempt.sections.map((section) => {
    const inSubtest = questions.filter((question) => question.subtestId === section.subtestId);
    return {
      id: section.id,
      code: section.subtest.code,
      name: section.subtest.name,
      total: inSubtest.length,
      answered: inSubtest.filter((question) => question.answers.length > 0).length,
    };
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <div>
        <p className="text-sm text-zinc-500">{attempt.tryout.title}</p>
        <h1 className="text-2xl font-semibold">Tryout selesai</h1>
        {attempt.submittedAt && (
          <p className="mt-1 text-zinc-600">
            Dikumpulkan {formatDateTime(attempt.submittedAt)}
            {attempt.autoSubmitted && " (otomatis, waktu habis)"}.
          </p>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subtes</th>
              <th className="px-4 py-2 text-right font-medium">Terjawab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <span className="mr-2 font-mono text-xs text-zinc-400">{row.code}</span>
                  {row.name}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.answered} / {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-zinc-500">Skor, pembahasan, dan peringkat akan tampil di halaman ini.</p>
      <Link href="/tryouts" className="self-start rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium hover:bg-zinc-100">
        Kembali ke daftar tryout
      </Link>
    </div>
  );
}
