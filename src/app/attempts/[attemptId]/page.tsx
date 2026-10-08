import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { findAttemptForUser, getExamQuestions, getSavedAnswers, timelineOf } from "@/lib/attempts";
import { requireUser } from "@/lib/session";

import { ExamRoom } from "./exam-room";
import { AttemptResults } from "./results";
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

  if (attempt.status === "SUBMITTED") return <AttemptResults attempt={attempt} />;

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
