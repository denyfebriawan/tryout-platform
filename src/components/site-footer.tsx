import Link from "next/link";

import { siteConfig } from "@/lib/site";

const footerLink = "text-zinc-600 underline-offset-2 hover:text-indigo-700 hover:underline";

// Static on every page: it reads nothing from the request, so it's part of the prerendered shell.
export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-zinc-500">
          <span className="font-semibold text-indigo-600">{siteConfig.name}</span> · Proyek demo. Pembayaran memakai
          Midtrans sandbox, tidak ada uang sungguhan.
        </p>
        <nav className="flex gap-4">
          <Link href="/tryouts" className={footerLink}>
            Tryout
          </Link>
          <Link href="/premium" className={footerLink}>
            Premium
          </Link>
          <Link href="/login" className={footerLink}>
            Akun demo
          </Link>
        </nav>
      </div>
    </footer>
  );
}
