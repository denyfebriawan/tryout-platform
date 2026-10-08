// Database access for attempts: loading them, reading the questions of the open section,
// and writing the timeline back. Shared by the exam page and the attempt Server Actions.
import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { buildTimeline, type Timeline } from "@/lib/attempt-timeline";
import { prisma } from "@/lib/prisma";
import { SCORE_SCALE, scoreAttempt } from "@/lib/scoring";

const attemptInclude = {
  tryout: { select: { title: true, slug: true, examType: true } },
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
  const sectionWrites: { id: string; data: Prisma.AttemptSectionUpdateInput }[] = [];

  timeline.sections.forEach((section, index) => {
    if (section.state === "upcoming") return;
    const stored = attempt.sections[index];
    const data: Prisma.AttemptSectionUpdateInput = {};
    if (!stored.startedAt) {
      data.startedAt = section.startedAt;
      data.deadline = section.deadline;
    }
    if (section.state === "done" && !stored.submittedAt) data.submittedAt = section.endedAt;
    if (Object.keys(data).length > 0) sectionWrites.push({ id: stored.id, data });
  });

  const last = timeline.sections.at(-1);
  const submit = timeline.finished && last ? { submittedAt: last.endedAt, autoSubmitted: !last.endedEarly } : null;
  if (sectionWrites.length === 0 && !submit) return;

  // One transaction: an attempt is never marked SUBMITTED without its score, or the other way round.
  await prisma.$transaction(async (tx) => {
    for (const { id, data } of sectionWrites) await tx.attemptSection.update({ where: { id }, data });
    if (submit) await submitAndScore(tx, attempt, submit);
  });
}

// Marks the attempt SUBMITTED and stores its scores. Runs only once per attempt, even when several
// requests finish it at the same moment (the countdown hitting zero in two tabs, say).
async function submitAndScore(
  tx: Prisma.TransactionClient,
  attempt: AttemptWithSections,
  { submittedAt, autoSubmitted }: { submittedAt: Date; autoSubmitted: boolean },
) {
  // The status filter is the guard. The UPDATE also locks the attempt row until this transaction
  // commits, so a concurrent request waits here, then matches nothing (count 0) and stops.
  // The same lock makes saveAnswer wait, so no answer can sneak in after the score is computed.
  const { count } = await tx.attempt.updateMany({
    where: { id: attempt.id, status: "IN_PROGRESS" },
    data: { status: "SUBMITTED", submittedAt, autoSubmitted },
  });
  if (count === 0) return;

  const subtestIds = attempt.sections.map((section) => section.subtestId);
  // Reading the answer key is fine here: the attempt is now submitted. (A transaction runs its
  // queries one at a time on a single connection, so there's nothing to gain from Promise.all.)
  const questions = await tx.question.findMany({
    where: { subtestId: { in: subtestIds } },
    select: { id: true, subtestId: true, weight: true, options: { where: { isCorrect: true }, select: { id: true } } },
  });
  const answers = await tx.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
    select: { id: true, questionId: true, selectedOptionId: true },
  });

  const result = scoreAttempt({
    scale: SCORE_SCALE[attempt.tryout.examType],
    subtestIds,
    // A question without a marked correct option (an admin mistake) can't be answered right.
    questions: questions.map((q) => ({ ...q, correctOptionId: q.options[0]?.id ?? "" })),
    selections: Object.fromEntries(answers.map((answer) => [answer.questionId, answer.selectedOptionId])),
  });

  // Mark each saved answer right or wrong: two statements instead of one per answer.
  const rightIds = answers.filter((answer) => result.isCorrect[answer.questionId]).map((answer) => answer.id);
  const wrongIds = answers.filter((answer) => !result.isCorrect[answer.questionId]).map((answer) => answer.id);
  await tx.attemptAnswer.updateMany({ where: { id: { in: rightIds } }, data: { isCorrect: true } });
  await tx.attemptAnswer.updateMany({ where: { id: { in: wrongIds } }, data: { isCorrect: false } });

  for (const [index, section] of attempt.sections.entries()) {
    await tx.attemptSection.update({ where: { id: section.id }, data: { score: result.subtests[index].score } });
  }
  await tx.attempt.update({ where: { id: attempt.id }, data: { score: result.score } });
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
