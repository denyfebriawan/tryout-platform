import type { Metadata } from "next";
import { Suspense } from "react";

import { createTryout } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/session";

import { Breadcrumbs, Card } from "../../_components/admin-chrome";
import { TryoutForm } from "../../_components/tryout-form";

export const metadata: Metadata = { title: "Tryout Baru" };

export default function NewTryoutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Memuat...</p>}>
        <NewTryoutContent />
      </Suspense>
    </main>
  );
}

// Everything admin-specific, headings included, renders after the role check: content in the static
// shell would reach non-admins too, and the admin area should look like a plain 404 to them.
async function NewTryoutContent() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tryout baru" }]} />
      <h1 className="text-2xl font-semibold">Tryout baru</h1>
      <Card title="Detail tryout">
        <p className="-mt-2 text-sm text-zinc-500">
          Tryout baru disimpan sebagai draft. Setelah subtes dan soal lengkap, publikasikan dari halaman tryout.
        </p>
        <TryoutForm action={createTryout} submitLabel="Buat tryout" />
      </Card>
    </div>
  );
}
