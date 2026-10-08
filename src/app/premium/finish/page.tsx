import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AutoRefresh } from "@/components/auto-refresh";
import type { PaymentStatus } from "@/generated/prisma/client";
import { formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Status Pembayaran" };

// Where the user lands after the Snap popup (or Midtrans's redirect). It shows what the webhook has
// recorded so far. The query string Midtrans adds (transaction_status=...) is ignored on purpose:
// the user can edit it, so only our database decides whether the payment went through.
export default function PaymentFinishPage({ searchParams }: PageProps<"/premium/finish">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Status Pembayaran</h1>
      <Suspense fallback={<p className="text-zinc-500">Memuat status pembayaran...</p>}>
        <PaymentStatusContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function PaymentStatusContent({ searchParams }: Pick<PageProps<"/premium/finish">, "searchParams">) {
  const user = await requireUser();
  const { order_id } = await searchParams;
  if (typeof order_id !== "string") notFound();

  // Scoped to the signed-in user, so nobody can look up someone else's order.
  const payment = await prisma.payment.findFirst({
    where: { orderId: order_id, userId: user.id },
    select: { orderId: true, amount: true, status: true, paymentType: true },
  });
  if (!payment) notFound();

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
      <StatusMessage status={payment.status} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-zinc-500">Order ID</dt>
        <dd className="font-mono break-all">{payment.orderId}</dd>
        <dt className="text-zinc-500">Jumlah</dt>
        <dd>{formatRupiah(payment.amount)}</dd>
        {payment.paymentType && (
          <>
            <dt className="text-zinc-500">Metode</dt>
            <dd>{payment.paymentType.replaceAll("_", " ")}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function StatusMessage({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "PAID":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-lg font-medium text-emerald-700">Pembayaran berhasil. Akun kamu sekarang Premium!</p>
          <Link href="/tryouts" className="rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
            Mulai tryout premium
          </Link>
        </div>
      );
    case "PENDING":
      return (
        <div className="flex flex-col gap-1">
          {/* Polls until the webhook marks the payment as paid, failed or expired. */}
          <AutoRefresh />
          <p className="text-lg font-medium text-amber-700">Menunggu konfirmasi pembayaran...</p>
          <p className="text-sm text-zinc-500">
            Halaman ini diperbarui otomatis. Untuk transfer bank atau e-wallet di mode sandbox, selesaikan pembayaran lewat
            Payment Simulator Midtrans.
          </p>
        </div>
      );
    case "FAILED":
    case "EXPIRED":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-lg font-medium text-red-700">
            {status === "EXPIRED" ? "Pembayaran kedaluwarsa." : "Pembayaran gagal."}
          </p>
          <Link href="/premium" className="text-sm font-medium text-indigo-600 hover:underline">
            Coba bayar lagi
          </Link>
        </div>
      );
  }
}
