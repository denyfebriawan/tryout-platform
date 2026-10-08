import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { deleteSubtest, updateSubtest } from "@/lib/admin-actions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { ActionButton } from "../../_components/action-button";
import { Breadcrumbs, Card, LockNotice } from "../../_components/admin-chrome";
import { SubtestForm } from "../../_components/subtest-form";

export const metadata: Metadata = { title: "Kelola Subtes" };

export default function AdminSubtestPage({ params }: PageProps<"/admin/subtests/[subtestId]">) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat subtes...</p>}>
        <AdminSubtestContent params={params} />
      </Suspense>
    </main>
  );
}

async function AdminSubtestContent({ params }: { params: Promise<{ subtestId: string }> }) {
  await requireAdmin();
  const { subtestId } = await params;

  const subtest = await prisma.subtest.findUnique({
    where: { id: subtestId },
    select: {
      id: true,
      code: true,
      name: true,
      durationSeconds: true,
      tryout: { select: { id: true, title: true, _count: { select: { attempts: true } } } },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          stem: true,
          weight: true,
          // Admin-only page, so reading the answer key is fine here.
          options: { where: { isCorrect: true }, select: { label: true } },
        },
      },
    },
  });
  if (!subtest) notFound();

  const attemptCount = subtest.tryout._count.attempts;
  const locked = attemptCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: subtest.tryout.title, href: `/admin/tryouts/${subtest.tryout.id}` },
          { label: subtest.code },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          <span className="mr-2 font-mono text-base text-zinc-400">{subtest.code}</span>
          {subtest.name}
        </h1>
        {!locked && (
          <ActionButton
            action={deleteSubtest.bind(null, subtest.id)}
            variant="danger"
            pendingText="Menghapus..."
            confirmText={`Hapus subtes ${subtest.code} beserta ${subtest.questions.length} soalnya?`}
          >
            Hapus subtes
          </ActionButton>
        )}
      </div>

      {locked && <LockNotice attemptCount={attemptCount} />}

      <Card title="Detail subtes">
        <SubtestForm
          action={updateSubtest.bind(null, subtest.id)}
          initial={{ code: subtest.code, name: subtest.name, durationSeconds: subtest.durationSeconds }}
          durationLocked={locked}
          submitLabel="Simpan"
        />
      </Card>

      <Card title={`Soal · ${subtest.questions.length}`}>
        {subtest.questions.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada soal.</p>
        ) : (
          <ol className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {subtest.questions.map((question, index) => (
              <li key={question.id}>
                {/* The whole row is the link; "group" lets the Edit label react to hovering anywhere on it. */}
                <Link
                  href={`/admin/questions/${question.id}`}
                  className="group flex items-start gap-3 px-4 py-3 text-sm hover:bg-indigo-50/50"
                >
                  <span className="w-5 shrink-0 text-zinc-400">{index + 1}</span>
                  <span className="line-clamp-2 flex-1">{question.stem}</span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    Kunci {question.options[0]?.label ?? "–"} · bobot {question.weight}
                  </span>
                  <span className="shrink-0 font-medium text-indigo-700 group-hover:underline">Edit</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {!locked && (
          <Link
            href={`/admin/subtests/${subtest.id}/questions/new`}
            className="self-start rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tambah soal
          </Link>
        )}
      </Card>
    </div>
  );
}
