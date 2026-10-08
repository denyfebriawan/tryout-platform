import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { premiumPlan } from "@/lib/premium-plan";
import { siteConfig } from "@/lib/site";

// The landing page reads nothing from the request, so the whole page is prerendered at build time.
// The header (with its own Suspense boundary) is the only part that changes per visitor.

const primaryButton = "rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700";
const secondaryButton = "rounded-md border border-zinc-300 bg-white px-5 py-2.5 font-medium text-zinc-800 hover:bg-zinc-100";

const features = [
  {
    title: "Timer per subtes",
    body: "Setiap subtes punya waktunya sendiri dan berjalan berurutan seperti UTBK asli. Waktu dihitung di server, jadi tidak bisa diakali dari browser.",
  },
  {
    title: "Navigasi & ragu-ragu",
    body: "Lompat ke nomor mana pun, tandai soal yang masih ragu, dan lihat sekilas mana yang sudah dijawab.",
  },
  {
    title: "Jawaban tersimpan otomatis",
    body: "Setiap jawaban langsung disimpan. Refresh atau koneksi putus tidak menghapus pekerjaan, dan timer tetap berlanjut.",
  },
  {
    title: "Skor & pembahasan",
    body: "Skor per subtes dan skor total langsung keluar begitu tryout selesai, lengkap dengan kunci dan pembahasan tiap soal.",
  },
  {
    title: "Leaderboard",
    body: "Bandingkan skor dengan peserta lain di setiap tryout dan lihat peringkatmu.",
  },
  {
    title: "Dashboard peserta",
    body: "Riwayat tryout, skor terbaik, peringkat, dan tryout yang belum dikerjakan dalam satu halaman.",
  },
];

const steps = [
  { title: "Daftar gratis", body: "Buat akun dalam satu menit. Satu tryout UTBK-SNBT langsung terbuka." },
  { title: "Kerjakan tryout", body: "Subtes berjalan berurutan dengan timer masing-masing, seperti hari ujian." },
  { title: "Lihat skor & peringkat", body: "Pelajari pembahasan, cek posisimu di leaderboard, lalu ulangi dengan tryout lain." },
];

// Official UTBK-SNBT subtests. TPS is the first four.
const utbkSubtests = [
  "Penalaran Umum",
  "Pengetahuan & Pemahaman Umum",
  "Pemahaman Bacaan & Menulis",
  "Pengetahuan Kuantitatif",
  "Literasi Bahasa Indonesia",
  "Literasi Bahasa Inggris",
  "Penalaran Matematika",
];

// Phase 2 features from the full requirement list, shown so the roadmap is visible in the demo.
const comingSoon = [
  { title: "Video tips & trik UTBK", body: "Video on demand dari pengajar, tersedia untuk akun Premium." },
  { title: "Katalog event & bimbel", body: "Jadwal tryout akbar, webinar, dan kelas bimbingan belajar." },
  { title: "Tes minat bakat", body: "Asesmen untuk membantu memilih jurusan yang paling cocok." },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-20">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              UTBK-SNBT &amp; TKA
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Latihan UTBK dan TKA dengan suasana ujian sungguhan
            </h1>
            <p className="text-lg text-zinc-600">{siteConfig.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={primaryButton}>
                Coba gratis
              </Link>
              <Link href="/tryouts" className={secondaryButton}>
                Lihat daftar tryout
              </Link>
            </div>
          </div>
          <ExamRoomPreview />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Dibuat untuk meniru hari ujian</h2>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Bukan sekadar kumpulan soal. Alur, waktu, dan penilaiannya mengikuti cara UTBK berjalan.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title} className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Cara kerjanya</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Exam coverage */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">UTBK-SNBT</h2>
          <p className="mt-1 text-sm text-zinc-600">Tujuh subtes, skor 0–1000.</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            {utbkSubtests.map((name, index) => (
              <li key={name} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                {name}
                {index < 4 && <span className="text-xs text-zinc-400">TPS</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">TKA</h2>
          <p className="mt-1 text-sm text-zinc-600">Tes Kemampuan Akademik, skor 0–100.</p>
          <p className="mt-4 text-sm text-zinc-700">
            Tryout TKA memakai mesin ujian yang sama: subtes berurutan, timer di server, dan pembahasan setelah selesai.
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            Admin bisa menambah tryout, subtes, dan soal baru langsung dari dashboard admin.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Harga</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-6">
              <div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Gratis</span>
                <p className="mt-3 text-3xl font-bold">{formatRupiah(0)}</p>
              </div>
              <ul className="space-y-2 text-sm text-zinc-700">
                <PlanItem>Tryout gratis dengan timer, skor, dan pembahasan</PlanItem>
                <PlanItem>Leaderboard dan dashboard peserta</PlanItem>
              </ul>
              <Link href="/register" className={`mt-auto self-start ${secondaryButton}`}>
                Daftar gratis
              </Link>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-amber-300 p-6">
              <div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {premiumPlan.name}
                </span>
                <p className="mt-3 text-3xl font-bold">{formatRupiah(premiumPlan.priceIdr)}</p>
                <p className="text-sm text-zinc-500">sekali bayar</p>
              </div>
              <ul className="space-y-2 text-sm text-zinc-700">
                {premiumPlan.benefits.map((benefit) => (
                  <PlanItem key={benefit}>{benefit}</PlanItem>
                ))}
              </ul>
              <Link href="/premium" className={`mt-auto self-start ${primaryButton}`}>
                Lihat Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Segera hadir</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {comingSoon.map((item) => (
            <li key={item.title} className="rounded-xl border border-dashed border-zinc-300 p-5">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">Segera</span>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Demo call to action */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-col items-start gap-4 rounded-xl bg-indigo-600 p-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ingin langsung mencoba?</h2>
            <p className="mt-1 text-indigo-100">
              Halaman Masuk menampilkan akun demo untuk peserta gratis, peserta premium, dan admin.
            </p>
          </div>
          <Link href="/login" className="rounded-md bg-white px-5 py-2.5 font-medium text-indigo-700 hover:bg-indigo-50">
            Masuk dengan akun demo
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlanItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-emerald-600">✓</span>
      {children}
    </li>
  );
}

// A static picture of the exam room, built from the same colors as the real one. Purely decorative.
function ExamRoomPreview() {
  // 1 = answered, 2 = flagged as doubtful, 0 = not answered yet. Question 3 is the current one.
  const navigation = [1, 1, 2, 1, 0, 1, 0, 0, 2, 0];
  const options = ["240", "300", "360", "420", "480"];

  return (
    <div aria-hidden="true" className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">Subtes 4 dari 7</p>
          <p className="text-sm font-semibold">Pengetahuan Kuantitatif</p>
        </div>
        <span className="rounded-md bg-zinc-900 px-3 py-1 font-mono text-sm text-white">12:34</span>
      </div>

      <div className="mt-3 rounded-lg bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">Soal 3</p>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Ragu-ragu</span>
        </div>
        <p className="mt-2 text-sm text-zinc-800">
          Sebuah toko memberi diskon 20% lalu 25% untuk harga Rp600.000. Berapa ribu rupiah harga akhirnya?
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {options.map((option, index) => (
            <li
              key={option}
              className={`flex gap-2 rounded-md border px-3 py-1.5 ${
                index === 2 ? "border-indigo-500 bg-indigo-50" : "border-zinc-200"
              }`}
            >
              <span className="font-medium text-zinc-500">{"ABCDE"[index]}.</span> {option}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1.5 rounded-lg bg-white p-3">
        {navigation.map((state, index) => (
          <span
            key={index}
            className={`flex aspect-square items-center justify-center rounded text-xs font-medium ${
              state === 1 ? "bg-indigo-600 text-white" : state === 2 ? "bg-amber-400 text-amber-950" : "border border-zinc-300 text-zinc-600"
            } ${index === 2 ? "ring-2 ring-indigo-300 ring-offset-1" : ""}`}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
