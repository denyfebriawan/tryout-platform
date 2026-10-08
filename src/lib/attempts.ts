// Database access for attempts: loading them, reading the questions of the open section,
// and writing the timeline back. Shared by the exam page and the attempt Server Actions.
import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { buildTimeline, type Timeline } from "@/lib/attempt-timeline";
import { prisma } from "@/lib/prisma";

const attemptInclude = {
  tryout: { select: { title: true, slug: true } },
  sections: {
    // Sections must come back in subtest order: the timeline chains them in array order.
    orderBy: { subtest: { order: "asc" } },
    include: { subtest: { select: { order: true, code: true, name: true, durationSeconds: true } } },
  },
} satisfies Prisma.AttemptInclude;

export type AttemptWithSections = Prisma.AttemptGetPayload<{ include: typeof attemptInclude }>;

// Filtering by userId as well as id means a participant can never load someone else's attempt.
export function findAttemptForUser(attemptId: string, userId: string) {
  return prisma.attempt.findFirst({ where: { id: attemptId, userId }, include: attemptInclude });
}

export function timelineOf(attempt: AttemptWithSections, now: Date): Timeline {
  const sections = attempt.sections.map((section) => ({
    id: section.id,
    durationSeconds: section.subtest.durationSeconds,
    startedAt: section.startedAt,
    deadline: section.deadline,
    submittedAt: section.submittedAt,
  }));
  return buildTimeline(attempt.startedAt, sections, now);
}

// Writes what the timeline worked out back to the database: opening times for sections that have
// started, close times for sections that have ended, and the attempt's own submission once every
// section is over. `attempt` must be the rows as they are in the database, so we only write changes.
// Safe to run more than once or concurrently: every run writes the same values.
export async function persistTimeline(attempt: AttemptWithSections, timeline: Timeline) {
  const writes: Prisma.PrismaPromise<unknown>[] = [];

  timeline.sections.forEach((section, index) => {
    if (section.state === "upcoming") return;
    const stored = attempt.sections[index];
    const data: Prisma.AttemptSectionUpdateInput = {};
    if (!stored.startedAt) {
      data.startedAt = section.startedAt;
      data.deadline = section.deadline;
    }
    if (section.state === "done" && !stored.submittedAt) data.submittedAt = section.endedAt;
    if (Object.keys(data).length > 0) {
      writes.push(prisma.attemptSection.update({ where: { id: stored.id }, data }));
    }
  });

  const last = timeline.sections.at(-1);
  if (timeline.finished && last) {
    // updateMany with a status filter: if another request already submitted it, this matches nothing.
    // Scoring hooks in here in milestone 5.
    writes.push(
      prisma.attempt.updateMany({
        where: { id: attempt.id, status: "IN_PROGRESS" },
        data: { status: "SUBMITTED", submittedAt: last.endedAt, autoSubmitted: !last.endedEarly },
      }),
    );
  }

  if (writes.length > 0) await prisma.$transaction(writes);
}

// The questions of one subtest as the participant sees them. The select is a whitelist on purpose:
// the answer key (QuestionOption.isCorrect) and the explanation never leave the server here.
export function getExamQuestions(subtestId: string) {
  return prisma.question.findMany({
    where: { subtestId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      stimulus: true,
      stem: true,
      options: { orderBy: { label: "asc" }, select: { id: true, label: true, text: true } },
    },
  });
}

export type ExamQuestion = Awaited<ReturnType<typeof getExamQuestions>>[number];

export type SavedAnswer = { selectedOptionId: string | null; isFlagged: boolean };

// The participant's saved answers for one subtest, keyed by question id.
export async function getSavedAnswers(attemptId: string, subtestId: string): Promise<Record<string, SavedAnswer>> {
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId, question: { subtestId } },
    select: { questionId: true, selectedOptionId: true, isFlagged: true },
  });
  return Object.fromEntries(
    answers.map(({ questionId, selectedOptionId, isFlagged }) => [questionId, { selectedOptionId, isFlagged }]),
  );
}
