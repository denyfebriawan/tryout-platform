import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TryoutBadges } from "@/components/tryout-badges";
import { canAccessTryout } from "@/lib/access";
import { type AttemptWithSections, listAttemptsForUser, timelineOf } from "@/lib/attempts";
import { summarizeAttempts } from "@/lib/dashboard-stats";
import type { PaymentStatus } from "@/generated/prisma/client";
import { formatDateTime, formatRupiah, formatScore } from "@/lib/format";
import { getRanksForUser } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { SCORE_SCALE } from "@/lib/scoring";
import { type CurrentUser, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const textLink = "font-medium text-indigo-700 underline-offset-2 hover:underline";
const rowButton =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-50";

const PAYMENT_BADGE: Record<PaymentStatus, { text: string; className: string }> = {
  PAID: { text: "Lunas", className: "bg-emerald-50 text-emerald-700" },
  PENDING: { text: "Menunggu", className: "bg-amber-100 text-amber-800" },
  FAILED: { text: "Gagal", className: "bg-red-50 text-red-700" },
  EXPIRED: { text: "Kedaluwarsa", className: "bg-zinc-100 text-zinc-600" },
};

// The status page only knows which payment to show from its order_id query parameter.
const paymentHref = (orderId: string) => `/premium/finish?order_id=${encodeURIComponent(orderId)}`;

// The page shell is static. The part that needs the session streams in behind Suspense.
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat dashboard...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  // Redirects to /login when signed out. This check runs on every request to this page.
  const user = await requireUser();

  const [attempts, ranks, payments, otherTryouts] = await Promise.all([
    listAttemptsForUser(user.id),
    getRanksForUser(user.id),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderId: true, amount: true, status: true, createdAt: true, paidAt: true },
    }),
    // Published tryouts this participant hasn't started yet.
    prisma.tryout.findMany({
      where: { isPublished: true, attempts: { none: { userId: user.id } } },
      orderBy: [{ accessTier: "asc" }, { createdAt: "asc" }],
      select: { id: true, slug: true, title: true, examType: true, accessTier: true },
    }),
  ]);

  const inProgress = attempts.filter((attempt) => attempt.status === "IN_PROGRESS");
  const submitted = attempts.filter((attempt) => attempt.status === "SUBMITTED");
  const stats = summarizeAttempts(
    attempts.map((attempt) => ({ status: attempt.status, score: attempt.score, examType: attempt.tryout.examType })),
  );

  const statCards = [
    { label: "Tryout selesai", value: stats.finished },
    { label: "Sedang dikerjakan", value: stats.inProgress },
    { label: "Skor terbaik UTBK", value: <BestScore score={stats.best.UTBK} scale={SCORE_SCALE.UTBK} /> },
    { label: "Skor terbaik TKA", value: <BestScore score={stats.best.TKA} scale={SCORE_SCALE.TKA} /> },
  ];

  // Reading the clock is allowed here because this component already read the request (the session).
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Halo, {user.name}</h1>
        <p className="text-zinc-500">{user.email}</p>
      </div>

      <PlanCard user={user} pendingOrderId={payments.find((payment) => payment.status === "PENDING")?.orderId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Sedang dikerjakan</h2>
          <ul className="flex flex-col gap-3">
            {inProgress.map((attempt) => (
              <InProgressCard key={attempt.id} attempt={attempt} now={now} />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Riwayat tryout</h2>
        {submitted.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="mb-2 text-zinc-500">Belum ada tryout yang kamu selesaikan.</p>
            <Link href="/tryouts" className={`text-sm ${textLink}`}>
              Lihat daftar tryout
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tryout</th>
                  <th className="px-4 py-2 font-medium">Dikumpulkan</th>
                  <th className="px-4 py-2 text-right font-medium">Skor</th>
                  <th className="px-4 py-2 text-right font-medium">Peringkat</th>
                  <th className="px-4 py-2">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submitted.map((attempt) => {
                  const rank = ranks.get(attempt.id);
                  const { tryout } = attempt;
                  return (
                    <tr key={attempt.id}>
                      <td className="px-4 py-3">
                        {/* An unpublished tryout's page and leaderboard 404, so only the results page is linked. */}
                        {tryout.isPublished ? (
                          <Link href={`/tryouts/${tryout.slug}`} className={textLink}>
                            {tryout.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{tryout.title}</span>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
                          {!tryout.isPublished && <span className="text-xs text-zinc-500">Tidak tersedia lagi</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "-"}
                        {attempt.autoSubmitted && <p className="text-xs text-zinc-500">otomatis, waktu habis</p>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {attempt.score === null ? (
                          "-"
                        ) : (
                          <>
                            <span className="font-semibold">{formatScore(attempt.score)}</span>
                            <span className="text-zinc-400"> / {SCORE_SCALE[tryout.examType]}</span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {rank ? (
                          <>
                            #{rank.rank}
                            <span className="text-zinc-400"> dari {rank.total}</span>
                          </>
                        ) : (
                          "-"
                        )}
                        {tryout.isPublished && (
                          <div>
                            <Link href={`/tryouts/${tryout.slug}/leaderboard`} className={`text-xs ${textLink}`}>
                              Leaderboard
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/attempts/${attempt.id}`} className={rowButton}>
                          Lihat hasil
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {otherTryouts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Belum dikerjakan</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {otherTryouts.map((tryout) => {
              // Only decides what to show. startAttempt enforces the same rule on the server.
              const locked = !canAccessTryout(user, tryout);
              return (
                <li key={tryout.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{tryout.title}</span>
                    <TryoutBadges examType={tryout.examType} accessTier={tryout.accessTier} />
                  </div>
                  {locked ? (
                    <Link
                      href="/premium"
                      className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium whitespace-nowrap text-amber-800 hover:bg-amber-50"
                    >
                      Terkunci · Upgrade
                    </Link>
                  ) : (
                    <Link href={`/tryouts/${tryout.slug}`} className={rowButton}>
                      Lihat detail
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {payments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Riwayat pembayaran</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">Order ID</th>
                  <th className="px-4 py-2 text-right font-medium">Jumlah</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                      {formatDateTime(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs break-all text-zinc-500">{payment.orderId}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{formatRupiah(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${PAYMENT_BADGE[payment.status].className}`}
                      >
                        {PAYMENT_BADGE[payment.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={paymentHref(payment.orderId)} className={rowButton}>
                        Lihat status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function BestScore({ score, scale }: { score: number | undefined; scale: number }) {
  if (score === undefined) return "-";
  return (
    <>
      {formatScore(score)}
      <span className="ml-1 text-base font-normal text-zinc-400">/ {scale}</span>
    </>
  );
}

// A free user with a payment still waiting for Midtrans gets a way back to its status page,
// which they'd otherwise lose after closing the Snap popup.
function PlanCard({ user, pendingOrderId }: { user: CurrentUser; pendingOrderId: string | undefined }) {
  const pending = !user.isPremium && pendingOrderId !== undefined;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="mb-1 font-medium">Paket kamu</h2>
          {user.isPremium ? (
            <p className="text-zinc-600">Premium: semua tryout terbuka.</p>
          ) : (
            <p className="text-zinc-600">Gratis: tryout gratis saja. Upgrade ke Premium untuk membuka semua tryout.</p>
          )}
        </div>
        {user.isPremium ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">Premium</span>
        ) : (
          !pending && (
            <Link href="/premium" className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Upgrade ke Premium
            </Link>
          )
        )}
      </div>
      {pending && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">Ada pembayaran Premium yang masih menunggu konfirmasi.</p>
          <Link href={paymentHref(pendingOrderId)} className={rowButton}>
            Lihat status pembayaran
          </Link>
        </div>
      )}
    </section>
  );
}

// An unfinished attempt: which subtest is open and roughly how long it has left. The clock keeps running
// while the participant is away, so every section may already be over; opening the attempt then
// submits it (the attempt page's TimeUp step) and shows the results.
function InProgressCard({ attempt, now }: { attempt: AttemptWithSections; now: Date }) {
  const timeline = timelineOf(attempt, now);
  const activeIndex = timeline.sections.findIndex((section) => section.state === "active");
  const active = timeline.sections[activeIndex];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-col gap-1">
        <TryoutBadges examType={attempt.tryout.examType} accessTier={attempt.tryout.accessTier} />
        <span className="font-semibold">{attempt.tryout.title}</span>
        {active ? (
          <p className="text-sm text-amber-900">
            Subtes {activeIndex + 1} dari {attempt.sections.length}: {attempt.sections[activeIndex].subtest.name} · sisa
            sekitar {Math.ceil((active.deadline.getTime() - now.getTime()) / 60_000)} menit
          </p>
        ) : (
          <p className="text-sm text-amber-900">Waktu sudah habis. Buka untuk mengumpulkan dan melihat hasil.</p>
        )}
      </div>
      <Link
        href={`/attempts/${attempt.id}`}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-indigo-700"
      >
        {active ? "Lanjutkan" : "Lihat hasil"}
      </Link>
    </li>
  );
}
