import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TryoutBadges } from "@/components/tryout-badges";
import {
  createSubtest,
  deleteTryout,
  moveSubtest,
  setTryoutPublished,
  updateTryout,
} from "@/lib/admin-actions";
import { formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { ActionButton } from "../../_components/action-button";
import { Breadcrumbs, Card, LockNotice, PublishBadge } from "../../_components/admin-chrome";
import { SubtestForm } from "../../_components/subtest-form";
import { TryoutForm } from "../../_components/tryout-form";

export const metadata: Metadata = { title: "Kelola Tryout" };

export default function AdminTryoutPage({ params }: PageProps<"/admin/tryouts/[tryoutId]">) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat tryout...</p>}>
        <AdminTryoutContent params={params} />
      </Suspense>
    </main>
  );
}

async function AdminTryoutContent({ params }: { params: Promise<{ tryoutId: string }> }) {
  await requireAdmin();
  const { tryoutId } = await params;

  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      examType: true,
      accessTier: true,
      isPublished: true,
      _count: { select: { attempts: true } },
      subtests: {
        orderBy: { order: "asc" },
        select: { id: true, code: true, name: true, durationSeconds: true, _count: { select: { questions: true } } },
      },
    },
  });
  if (!tryout) notFound();

  const attemptCount = tryout._count.attempts;
  const locked = attemptCount > 0;
  const totalSeconds = tryout.subtests.reduce((sum, subtest) => sum + subtest.durationSeconds, 0);
  const totalQuestions = tryout.subtests.reduce((sum, subtest) => sum + subtest._count.questions, 0);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: tryout.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
            <PublishBadge isPublished={tryout.isPublished} />
          </div>
          <h1 className="text-2xl font-semibold">{tryout.title}</h1>
          {tryout.isPublished && (
            <Link href={`/tryouts/${tryout.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">
              Lihat halaman peserta
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {/* .bind() fixes the first arguments, so the button only has to send the form. */}
          {tryout.isPublished ? (
            <ActionButton action={setTryoutPublished.bind(null, tryout.id, false)} pendingText="Memproses...">
              Unpublish
            </ActionButton>
          ) : (
            <ActionButton
              action={setTryoutPublished.bind(null, tryout.id, true)}
              variant="primary"
              pendingText="Memproses..."
            >
              Publish
            </ActionButton>
          )}
          {!locked && (
            <ActionButton
              action={deleteTryout.bind(null, tryout.id)}
              variant="danger"
              pendingText="Menghapus..."
              confirmText={`Hapus "${tryout.title}" beserta semua subtes dan soalnya?`}
            >
              Hapus
            </ActionButton>
          )}
        </div>
      </div>

      {locked && <LockNotice attemptCount={attemptCount} />}

      <Card title="Detail tryout">
        <TryoutForm
          action={updateTryout.bind(null, tryout.id)}
          initial={{
            title: tryout.title,
            slug: tryout.slug,
            description: tryout.description ?? "",
            examType: tryout.examType,
            accessTier: tryout.accessTier,
          }}
          examTypeLocked={locked}
          submitLabel="Simpan"
        />
      </Card>

      <Card title={`Subtes · ${tryout.subtests.length} subtes, ${totalQuestions} soal, ${formatDuration(totalSeconds)}`}>
        {tryout.subtests.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada subtes. Tambahkan di bawah.</p>
        ) : (
          <>
            <p className="-mt-2 text-sm text-zinc-500">Klik subtes untuk mengubah detailnya dan mengelola soalnya.</p>
            <ol className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {tryout.subtests.map((subtest, index) => (
                <li key={subtest.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-5 text-zinc-400">{index + 1}</span>
                  <Link
                    href={`/admin/subtests/${subtest.id}`}
                    className="flex-1 font-medium text-indigo-700 underline-offset-2 hover:underline"
                  >
                    <span className="mr-2 font-mono text-xs text-zinc-400">{subtest.code}</span>
                    {subtest.name}
                  </Link>
                  <span className="text-zinc-500">{subtest._count.questions} soal</span>
                  <span className="w-32 text-right text-zinc-500">{formatDuration(subtest.durationSeconds)}</span>
                  <Link
                    href={`/admin/subtests/${subtest.id}`}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </Link>
                  {!locked && (
                    <div className="flex gap-1">
                      <ActionButton action={moveSubtest.bind(null, subtest.id, "up")} title="Naikkan">
                        ↑
                      </ActionButton>
                      <ActionButton action={moveSubtest.bind(null, subtest.id, "down")} title="Turunkan">
                        ↓
                      </ActionButton>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </Card>

      {!locked && (
        <Card title="Tambah subtes">
          <SubtestForm action={createSubtest.bind(null, tryout.id)} submitLabel="Tambah subtes" />
        </Card>
      )}
    </div>
  );
}
