import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { deleteQuestion, updateQuestion } from "@/lib/admin-actions";
import { OPTION_LABELS, type OptionLabel } from "@/lib/admin-forms";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { ActionButton } from "../../_components/action-button";
import { Breadcrumbs, Card, LockNotice } from "../../_components/admin-chrome";
import { QuestionForm } from "../../_components/question-form";

export const metadata: Metadata = { title: "Edit Soal" };

export default function AdminQuestionPage({ params }: PageProps<"/admin/questions/[questionId]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat soal...</p>}>
        <AdminQuestionContent params={params} />
      </Suspense>
    </main>
  );
}

async function AdminQuestionContent({ params }: { params: Promise<{ questionId: string }> }) {
  await requireAdmin();
  const { questionId } = await params;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      order: true,
      stimulus: true,
      stem: true,
      explanation: true,
      weight: true,
      options: { select: { label: true, text: true, isCorrect: true } },
      subtest: {
        select: {
          id: true,
          code: true,
          tryout: { select: { id: true, title: true, _count: { select: { attempts: true } } } },
        },
      },
    },
  });
  if (!question) notFound();

  const { subtest } = question;
  const attemptCount = subtest.tryout._count.attempts;
  const locked = attemptCount > 0;
  // Orders can have gaps after a delete, so the displayed number is the position, not the order value.
  const number = 1 + (await prisma.question.count({ where: { subtestId: subtest.id, order: { lt: question.order } } }));

  const optionText = Object.fromEntries(question.options.map((option) => [option.label, option.text]));
  const correct = question.options.find((option) => option.isCorrect)?.label;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: subtest.tryout.title, href: `/admin/tryouts/${subtest.tryout.id}` },
          { label: subtest.code, href: `/admin/subtests/${subtest.id}` },
          { label: `Soal ${number}` },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          Soal {number} · {subtest.code}
        </h1>
        {!locked && (
          <ActionButton
            action={deleteQuestion.bind(null, question.id)}
            variant="danger"
            pendingText="Menghapus..."
            confirmText={`Hapus soal ${number}?`}
          >
            Hapus soal
          </ActionButton>
        )}
      </div>

      {locked && <LockNotice attemptCount={attemptCount} />}

      <Card title="Isi soal">
        <QuestionForm
          action={updateQuestion.bind(null, question.id)}
          initial={{
            stimulus: question.stimulus ?? "",
            stem: question.stem,
            explanation: question.explanation ?? "",
            weight: question.weight,
            options: Object.fromEntries(OPTION_LABELS.map((label) => [label, optionText[label] ?? ""])) as Record<
              OptionLabel,
              string
            >,
            correctLabel: OPTION_LABELS.find((label) => label === correct) ?? "",
          }}
          scoringLocked={locked}
          submitLabel="Simpan"
        />
      </Card>
    </div>
  );
}
