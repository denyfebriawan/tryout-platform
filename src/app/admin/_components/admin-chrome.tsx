import Link from "next/link";
import type { ReactNode } from "react";

// Small layout pieces shared by the admin pages.

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span aria-hidden className="text-zinc-400">/</span>}
          {item.href ? (
            <Link href={item.href} className="font-medium text-indigo-700 underline-offset-2 hover:underline">
              {item.label}
            </Link>
          ) : (
            // The current page: plain text, marked for screen readers.
            <span aria-current="page" className="text-zinc-700">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function LockNotice({ attemptCount }: { attemptCount: number }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">Sudah dikerjakan {attemptCount} peserta · struktur dikunci</p>
      <p className="mt-1">
        Judul, deskripsi, akses, publikasi, dan teks soal masih bisa diubah. Menambah atau menghapus subtes dan soal,
        mengubah urutan, durasi, bobot, jenis ujian, dan kunci jawaban tidak bisa lagi, agar skor yang tersimpan tetap
        konsisten.
      </p>
    </div>
  );
}

export function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return isPublished ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Published</span>
  ) : (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">Draft</span>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}
