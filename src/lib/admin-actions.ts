"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { formValues, parseQuestionForm, parseSubtestForm, parseTryoutForm, publishProblems } from "@/lib/admin-forms";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Admin content writes. Every action calls requireAdmin() itself: a Server Action is a public POST
// endpoint, so the admin layout or page hiding a button is not enough.
//
// Once a tryout has attempts, its structure is locked: subtests and questions can't be added, removed
// or reordered, and durations, weights, answer keys and the exam type can't change. Those would make
// stored scores disagree with the results page, or break the timer of attempts in progress.
// Text (titles, question wording, explanations), access tier and publishing stay editable.

export type AdminFormState = { error?: string; message?: string; values?: Record<string, string> };

const LOCKED_MESSAGE =
  "Tryout ini sudah dikerjakan peserta, jadi strukturnya dikunci agar skor yang tersimpan tetap konsisten. " +
  "Untuk menyembunyikannya dari peserta, gunakan Unpublish.";
const SLUG_TAKEN = "Slug sudah dipakai tryout lain.";

// A rule the edit breaks. Its message goes back to the form as is.
class RuleError extends Error {}

function failed(error: string, formData?: FormData): AdminFormState {
  return { error, values: formData ? formValues(formData) : undefined };
}

type WriteResult<T> = { ok: true; value: T } | { ok: false; error: string };

// Runs a write and turns expected failures into a message for the form. Anything else is a bug,
// so it's rethrown to reach the error boundary and the server logs.
async function tryWrite<T>(write: () => Promise<T>, duplicateMessage = SLUG_TAKEN): Promise<WriteResult<T>> {
  try {
    return { ok: true, value: await write() };
  } catch (error) {
    if (error instanceof RuleError) return { ok: false, error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { ok: false, error: duplicateMessage };
      // A foreign key with onDelete: Restrict (an answer pointing at a question, say). The lock below
      // should make this unreachable, but if it happens the admin gets a message, not a crash.
      if (error.code === "P2003") {
        return { ok: false, error: "Data ini masih dipakai oleh data lain (misalnya jawaban peserta), jadi perubahan dibatalkan." };
      }
      if (error.code === "P2025") return { ok: false, error: "Data tidak ditemukan. Mungkin sudah dihapus." };
    }
    throw error;
  }
}

// Runs `write` in a transaction that holds a lock on the tryout row, and tells it whether anyone has
// started the tryout. Starting an attempt inserts a row that references the tryout, and Postgres makes
// that insert take a FOR KEY SHARE lock on the tryout row, which conflicts with FOR UPDATE. So no
// attempt can appear between the count and the commit: "no attempts yet" stays true while we edit.
function inTryout<T>(tryoutId: string, write: (tx: Prisma.TransactionClient, hasAttempts: boolean) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Tryout" WHERE id = ${tryoutId} FOR UPDATE`;
    if (rows.length === 0) throw new RuleError("Tryout tidak ditemukan. Mungkin sudah dihapus.");
    const attempts = await tx.attempt.count({ where: { tryoutId } });
    return write(tx, attempts > 0);
  });
}

// For structural changes: refuses as soon as the tryout has an attempt.
function inUnlockedTryout<T>(tryoutId: string, write: (tx: Prisma.TransactionClient) => Promise<T>) {
  return inTryout(tryoutId, (tx, hasAttempts) => {
    if (hasAttempts) throw new RuleError(LOCKED_MESSAGE);
    return write(tx);
  });
}

// A subtest or question never moves to another tryout, so its tryout id can be read before locking.
async function tryoutOfSubtest(subtestId: string) {
  const subtest = await prisma.subtest.findUnique({ where: { id: subtestId }, select: { tryoutId: true } });
  if (!subtest) throw new RuleError("Subtes tidak ditemukan. Mungkin sudah dihapus.");
  return subtest.tryoutId;
}

async function parentsOfQuestion(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { subtestId: true, subtest: { select: { tryoutId: true } } },
  });
  if (!question) throw new RuleError("Soal tidak ditemukan. Mungkin sudah dihapus.");
  return { subtestId: question.subtestId, tryoutId: question.subtest.tryoutId };
}

// ─── Tryouts ────────────────────────────────────────────────────────────────

export async function createTryout(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseTryoutForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);

  // New tryouts start as drafts: they can't be published until they have subtests and questions.
  const result = await tryWrite(() =>
    prisma.tryout.create({ data: { ...parsed.data, isPublished: false }, select: { id: true } }),
  );
  if (!result.ok) return failed(result.error, formData);
  redirect(`/admin/tryouts/${result.value.id}`);
}

export async function updateTryout(tryoutId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseTryoutForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);

  const result = await tryWrite(() =>
    inTryout(tryoutId, async (tx, hasAttempts) => {
      const current = await tx.tryout.findUniqueOrThrow({ where: { id: tryoutId }, select: { examType: true } });
      // The exam type picks the score scale (UTBK 0–1000, TKA 0–100), so scores already stored would be off.
      if (hasAttempts && parsed.data.examType !== current.examType) {
        throw new RuleError("Jenis ujian tidak bisa diubah karena tryout ini sudah dikerjakan peserta.");
      }
      await tx.tryout.update({ where: { id: tryoutId }, data: parsed.data });
    }),
  );
  if (!result.ok) return failed(result.error, formData);
  // Re-render the page in the same response, so it shows the saved values.
  refresh();
  return { message: "Perubahan tersimpan." };
}

export async function setTryoutPublished(tryoutId: string, publish: boolean): Promise<AdminFormState> {
  await requireAdmin();
  if (typeof publish !== "boolean") return failed("Permintaan tidak valid.");

  const result = await tryWrite(() =>
    // The lock also serializes this with structural edits, so nobody can delete the last question
    // between the check and the publish.
    inTryout(tryoutId, async (tx) => {
      if (publish) {
        const subtests = await tx.subtest.findMany({
          where: { tryoutId },
          orderBy: { order: "asc" },
          select: { code: true, _count: { select: { questions: true } } },
        });
        const problems = publishProblems(subtests.map((s) => ({ code: s.code, questionCount: s._count.questions })));
        if (problems.length > 0) throw new RuleError(`Belum bisa dipublikasikan. ${problems.join(" ")}`);
      }
      await tx.tryout.update({ where: { id: tryoutId }, data: { isPublished: publish } });
    }),
  );
  if (!result.ok) return failed(result.error);
  refresh();
  return {};
}

export async function deleteTryout(tryoutId: string): Promise<AdminFormState> {
  await requireAdmin();
  // Subtests, questions and options go with it (onDelete: Cascade).
  const result = await tryWrite(() => inUnlockedTryout(tryoutId, (tx) => tx.tryout.delete({ where: { id: tryoutId } })));
  if (!result.ok) return failed(result.error);
  redirect("/admin");
}

// ─── Subtests ───────────────────────────────────────────────────────────────

export async function createSubtest(tryoutId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseSubtestForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);

  const result = await tryWrite(() =>
    inUnlockedTryout(tryoutId, async (tx) => {
      // New subtests go last. The tryout lock means two admins can't both pick the same order.
      const last = await tx.subtest.aggregate({ where: { tryoutId }, _max: { order: true } });
      return tx.subtest.create({
        data: { tryoutId, order: (last._max.order ?? 0) + 1, ...parsed.data },
        select: { id: true },
      });
    }),
  );
  if (!result.ok) return failed(result.error, formData);
  redirect(`/admin/subtests/${result.value.id}`);
}

export async function updateSubtest(subtestId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseSubtestForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);

  const result = await tryWrite(async () =>
    inTryout(await tryoutOfSubtest(subtestId), async (tx, hasAttempts) => {
      const current = await tx.subtest.findUniqueOrThrow({ where: { id: subtestId }, select: { durationSeconds: true } });
      // Section deadlines chain from these durations (attempt-timeline.ts), so attempts in progress
      // would jump to a different section if one changed.
      if (hasAttempts && parsed.data.durationSeconds !== current.durationSeconds) {
        throw new RuleError("Durasi tidak bisa diubah karena tryout ini sudah dikerjakan peserta.");
      }
      await tx.subtest.update({ where: { id: subtestId }, data: parsed.data });
    }),
  );
  if (!result.ok) return failed(result.error, formData);
  refresh();
  return { message: "Perubahan tersimpan." };
}

export async function moveSubtest(subtestId: string, direction: "up" | "down"): Promise<AdminFormState> {
  await requireAdmin();
  if (direction !== "up" && direction !== "down") return failed("Permintaan tidak valid.");

  const result = await tryWrite(async () => {
    const tryoutId = await tryoutOfSubtest(subtestId);
    await inUnlockedTryout(tryoutId, async (tx) => {
      const siblings = await tx.subtest.findMany({
        where: { tryoutId },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });
      const index = siblings.findIndex((s) => s.id === subtestId);
      const current = siblings[index];
      const other = siblings[direction === "up" ? index - 1 : index + 1];
      if (!current || !other) return; // already first or last

      // (tryoutId, order) is unique, so park one row on a free value while the two swap.
      await tx.subtest.update({ where: { id: current.id }, data: { order: -1 } });
      await tx.subtest.update({ where: { id: other.id }, data: { order: current.order } });
      await tx.subtest.update({ where: { id: current.id }, data: { order: other.order } });
    });
  });
  if (!result.ok) return failed(result.error);
  refresh();
  return {};
}

export async function deleteSubtest(subtestId: string): Promise<AdminFormState> {
  await requireAdmin();
  let tryoutId = "";
  const result = await tryWrite(async () => {
    tryoutId = await tryoutOfSubtest(subtestId);
    await inUnlockedTryout(tryoutId, (tx) => tx.subtest.delete({ where: { id: subtestId } }));
  });
  if (!result.ok) return failed(result.error);
  redirect(`/admin/tryouts/${tryoutId}`);
}

// ─── Questions ──────────────────────────────────────────────────────────────

export async function createQuestion(subtestId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseQuestionForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);
  const { options, correctLabel, ...question } = parsed.data;

  const result = await tryWrite(async () =>
    inUnlockedTryout(await tryoutOfSubtest(subtestId), async (tx) => {
      const last = await tx.question.aggregate({ where: { subtestId }, _max: { order: true } });
      await tx.question.create({
        data: {
          subtestId,
          order: (last._max.order ?? 0) + 1,
          ...question,
          options: {
            create: options.map((option) => ({ ...option, isCorrect: option.label === correctLabel })),
          },
        },
      });
    }),
  );
  if (!result.ok) return failed(result.error, formData);
  redirect(`/admin/subtests/${subtestId}`);
}

export async function updateQuestion(questionId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseQuestionForm(formData);
  if (!parsed.ok) return failed(parsed.error, formData);
  const { options, correctLabel, ...question } = parsed.data;

  const result = await tryWrite(async () =>
    inTryout((await parentsOfQuestion(questionId)).tryoutId, async (tx, hasAttempts) => {
      const current = await tx.question.findUniqueOrThrow({
        where: { id: questionId },
        select: { weight: true, options: { where: { isCorrect: true }, select: { label: true } } },
      });
      // Answers were already marked right or wrong with the old key and weight.
      if (hasAttempts && (question.weight !== current.weight || correctLabel !== current.options[0]?.label)) {
        throw new RuleError("Kunci jawaban dan bobot tidak bisa diubah karena tryout ini sudah dikerjakan peserta.");
      }
      await tx.question.update({ where: { id: questionId }, data: question });
      for (const option of options) {
        await tx.questionOption.update({
          where: { questionId_label: { questionId, label: option.label } },
          data: { text: option.text, isCorrect: option.label === correctLabel },
        });
      }
    }),
  );
  if (!result.ok) return failed(result.error, formData);
  refresh();
  return { message: "Perubahan tersimpan." };
}

export async function deleteQuestion(questionId: string): Promise<AdminFormState> {
  await requireAdmin();
  let subtestId = "";
  const result = await tryWrite(async () => {
    const parents = await parentsOfQuestion(questionId);
    subtestId = parents.subtestId;
    await inUnlockedTryout(parents.tryoutId, (tx) => tx.question.delete({ where: { id: questionId } }));
  });
  if (!result.ok) return failed(result.error);
  redirect(`/admin/subtests/${subtestId}`);
}
