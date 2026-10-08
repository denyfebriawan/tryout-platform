import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { createQuestion } from "@/lib/admin-actions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { Breadcrumbs, Card, LockNotice } from "../../../../_components/admin-chrome";
import { QuestionForm } from "../../../../_components/question-form";

export const metadata: Metadata = { title: "Soal Baru" };

export default function NewQuestionPage({ params }: PageProps<"/admin/subtests/[subtestId]/questions/new">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat...</p>}>
        <NewQuestionContent params={params} />
      </Suspense>
    </main>
  );
}

async function NewQuestionContent({ params }: { params: Promise<{ subtestId: string }> }) {
  await requireAdmin();
  const { subtestId } = await params;

  const subtest = await prisma.subtest.findUnique({
    where: { id: subtestId },
    select: {
      id: true,
      code: true,
      tryout: { select: { id: true, title: true, _count: { select: { attempts: true } } } },
    },
  });
  if (!subtest) notFound();
  const attemptCount = subtest.tryout._count.attempts;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: subtest.tryout.title, href: `/admin/tryouts/${subtest.tryout.id}` },
          { label: subtest.code, href: `/admin/subtests/${subtest.id}` },
          { label: "Soal baru" },
        ]}
      />
      <h1 className="text-2xl font-semibold">Soal baru</h1>
      {/* The page only hides the form; createQuestion refuses on its own as well. */}
      {attemptCount > 0 ? (
        <LockNotice attemptCount={attemptCount} />
      ) : (
        <Card title="Isi soal">
          <QuestionForm action={createQuestion.bind(null, subtest.id)} submitLabel="Simpan soal" />
        </Card>
      )}
    </div>
  );
}
