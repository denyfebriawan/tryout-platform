"use server";

import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { canAccessTryout } from "@/lib/access";
import { acceptsAnswers } from "@/lib/attempt-timeline";
import { findAttemptForUser, persistTimeline, type SavedAnswer, timelineOf } from "@/lib/attempts";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Every action here is a public POST endpoint. TypeScript types don't exist at runtime, so each one
// checks its arguments, and identity always comes from the session, never from the arguments.

export async function startAttempt(formData: FormData) {
  const user = await requireUser();
  const tryoutId = String(formData.get("tryoutId") ?? "");

  const tryout = await prisma.tryout.findFirst({
    where: { id: tryoutId, isPublished: true },
    select: {
      id: true,
      accessTier: true,
      subtests: { orderBy: { order: "asc" }, select: { id: true, durationSeconds: true } },
    },
  });
  if (!tryout || tryout.subtests.length === 0) notFound();
  // The real premium check. The tryout page hides the start button from free users, but anyone can
  // post this form by hand, so the server decides. isPremium comes fresh from the database (no
  // session cookie cache), so a payment that just upgraded the user counts right away.
  if (!canAccessTryout(user, tryout)) redirect("/premium");

  const existing = await prisma.attempt.findUnique({
    where: { userId_tryoutId: { userId: user.id, tryoutId: tryout.id } },
    select: { id: true },
  });
  if (existing) redirect(`/attempts/${existing.id}`);

  // The server sets the clock: the first section opens now, with a deadline from its duration.
  const now = new Date();
  const [first, ...rest] = tryout.subtests;
  let attemptId: string;
  try {
    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        tryoutId: tryout.id,
        startedAt: now,
        sections: {
          create: [
            { subtestId: first.id, startedAt: now, deadline: new Date(now.getTime() + first.durationSeconds * 1000) },
            ...rest.map((subtest) => ({ subtestId: subtest.id })),
          ],
        },
      },
      select: { id: true },
    });
    attemptId = attempt.id;
  } catch (error) {
    // A double click can get two requests past the check above. The unique (userId, tryoutId)
    // index rejects the second insert (P2002), and that request just joins the first attempt.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    const attempt = await prisma.attempt.findUniqueOrThrow({
      where: { userId_tryoutId: { userId: user.id, tryoutId: tryout.id } },
      select: { id: true },
    });
    attemptId = attempt.id;
  }
  redirect(`/attempts/${attemptId}`);
}

export type SaveAnswerInput = SavedAnswer & { attemptId: string; questionId: string };

// "closed" means the section is no longer accepting answers; the client reloads to catch up.
export type SaveAnswerResult = { ok: true } | { ok: false; error: "closed" | "invalid" };

function isSaveAnswerInput(input: unknown): input is SaveAnswerInput {
  if (typeof input !== "object" || input === null) return false;
  const value = input as Record<string, unknown>;
  return (
    typeof value.attemptId === "string" &&
    typeof value.questionId === "string" &&
    (value.selectedOptionId === null || typeof value.selectedOptionId === "string") &&
    typeof value.isFlagged === "boolean"
  );
}

// Autosave: called every time the participant picks an option or toggles "ragu-ragu".
export async function saveAnswer(input: SaveAnswerInput): Promise<SaveAnswerResult> {
  const user = await requireUser();
  if (!isSaveAnswerInput(input)) return { ok: false, error: "invalid" };
  const { attemptId, questionId, selectedOptionId, isFlagged } = input;

  const [attempt, question] = await Promise.all([
    findAttemptForUser(attemptId, user.id),
    prisma.question.findUnique({
      where: { id: questionId },
      select: { subtestId: true, options: { select: { id: true } } },
    }),
  ]);
  if (!attempt || !question) return { ok: false, error: "invalid" };
  if (selectedOptionId !== null && !question.options.some((option) => option.id === selectedOptionId)) {
    return { ok: false, error: "invalid" };
  }
  // The question must belong to this attempt's tryout.
  const index = attempt.sections.findIndex((section) => section.subtestId === question.subtestId);
  if (index === -1) return { ok: false, error: "invalid" };
  if (attempt.status !== "IN_PROGRESS") return { ok: false, error: "closed" };

  // The server's clock decides, not the client's countdown.
  const now = new Date();
  const timeline = timelineOf(attempt, now);
  if (!acceptsAnswers(timeline.sections[index], now)) {
    await persistTimeline(attempt, timeline);
    return { ok: false, error: "closed" };
  }

  const saved = await prisma.$transaction(async (tx) => {
    // Re-check the status with a shared lock on the attempt row. Scoring (submitAndScore) needs that
    // row exclusively, so the two can't overlap: either this save commits first and gets scored, or
    // scoring commits first and this check sees SUBMITTED. Without it, another tab could finish the
    // attempt between the check above and the upsert below, and the answer would miss the score.
    const open = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Attempt" WHERE id = ${attemptId} AND status = 'IN_PROGRESS' FOR SHARE`;
    if (open.length === 0) return false;

    // Unique on (attemptId, questionId), so saving the same question again updates the row.
    await tx.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, selectedOptionId, isFlagged },
      update: { selectedOptionId, isFlagged },
    });
    return true;
  });
  if (!saved) return { ok: false, error: "closed" };
  await persistTimeline(attempt, timeline);
  return { ok: true };
}

// The participant ends the open section early. The next section starts right away.
export async function submitSection(attemptId: string, sectionId: string) {
  const user = await requireUser();
  if (typeof attemptId !== "string" || typeof sectionId !== "string") return;

  const attempt = await findAttemptForUser(attemptId, user.id);
  if (attempt?.status === "IN_PROGRESS") {
    const now = new Date();
    const index = attempt.sections.findIndex((section) => section.id === sectionId);
    // Only the open section can be closed. Anything else (a stale tab, a replayed request) is ignored.
    if (index !== -1 && timelineOf(attempt, now).sections[index].state === "active") {
      // Work out the timeline as if the section were submitted now, then write the difference.
      const withSubmission = {
        ...attempt,
        sections: attempt.sections.map((section, i) => (i === index ? { ...section, submittedAt: now } : section)),
      };
      await persistTimeline(attempt, timelineOf(withSubmission, now));
    }
  }
  // Re-render the exam page in the same response, so it shows the next section (or the summary).
  refresh();
}

// Called by the client when its countdown reaches zero (and when a participant comes back after time
// ran out). The server checks the clock itself and closes whatever has expired: this is auto-submit.
export async function syncAttempt(attemptId: string) {
  const user = await requireUser();
  if (typeof attemptId !== "string") return;

  const attempt = await findAttemptForUser(attemptId, user.id);
  if (attempt?.status === "IN_PROGRESS") await persistTimeline(attempt, timelineOf(attempt, new Date()));
  refresh();
}
