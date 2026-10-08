import Link from "next/link";

// Shown for unknown URLs and whenever a page calls notFound(), e.g. a missing tryout or a
// non-admin opening /admin. It renders inside the root layout, so the header and footer stay.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <p className="text-sm font-medium text-indigo-600">404</p>
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-zinc-600">Halaman yang kamu cari tidak ada atau sudah tidak tersedia.</p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Ke beranda
        </Link>
        <Link href="/tryouts" className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-800 hover:bg-zinc-100">
          Lihat daftar tryout
        </Link>
      </div>
    </main>
  );
}
