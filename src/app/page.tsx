import Link from "next/link";

import { siteConfig } from "@/lib/site";

// Placeholder landing page. The full landing page comes in the polish milestone.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-6 px-4 py-16">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
        Latihan UTBK-SNBT dan TKA dengan suasana ujian sungguhan
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">{siteConfig.description}</p>
      <div className="flex gap-3">
        <Link href="/register" className="rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
          Coba gratis
        </Link>
        <Link href="/login" className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 font-medium hover:bg-zinc-100">
          Masuk
        </Link>
      </div>
    </main>
  );
}
