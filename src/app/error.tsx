"use client"; // Error boundaries must be Client Components: they catch errors while React renders in the browser.

import Link from "next/link";
import { useEffect } from "react";

// Catches unexpected errors in any page below the root layout (e.g. the database is unreachable).
// In production, errors from Server Components arrive without their message; `digest` matches the server log.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="text-zinc-600">
        Maaf, halaman ini gagal dimuat. Coba lagi sebentar lagi. Jawaban tryout yang sudah tersimpan tidak hilang.
      </p>
      {error.digest && <p className="font-mono text-xs text-zinc-400">Kode: {error.digest}</p>}
      <div className="flex gap-3">
        {/* retry() re-fetches the failed segment from the server and renders it again. */}
        <button type="button" onClick={() => retry()} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Coba lagi
        </button>
        <Link href="/" className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-800 hover:bg-zinc-100">
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
