import { type SeedTryout, TKA } from "./structure";

const binParagraph =
  "Perpustakaan sekolah kini membuka layanan hingga pukul 17.00. Koleksi buku fiksi dan nonfiksi juga ditambah lebih dari 300 judul. Selain itu, tersedia ruang diskusi yang dapat dipinjam siswa untuk belajar kelompok.";

const bigNotice =
  "NOTICE\n\nThe school library will be closed on Friday, 14 November, for maintenance. Students who need to return books on that day may use the drop box at the main entrance. The library will reopen on Monday at 7.30 a.m.";

export const tka1: SeedTryout = {
  slug: "tka-sma-1",
  title: "Tryout TKA SMA #1",
  description: "Tryout premium untuk tiga mata pelajaran wajib TKA SMA: Bahasa Indonesia, Matematika, dan Bahasa Inggris.",
  examType: "TKA",
  accessTier: "PREMIUM",
  subtests: [
    {
      ...TKA.BIN,
      questions: [
        {
          stem: "Kalimat yang berisi fakta adalah ...",
          options: [
            "Film itu adalah film terbaik tahun ini.",
            "Jembatan itu diresmikan pada 12 Maret 2024.",
            "Rasa makanan di warung itu paling enak.",
            "Kebijakan itu tampaknya akan berhasil.",
            "Desain gedung baru itu sangat indah.",
          ],
          answer: "B",
          explanation: "Tanggal peresmian dapat dibuktikan kebenarannya. Pilihan lain berisi penilaian pribadi (terbaik, paling enak, tampaknya, sangat indah).",
        },
        {
          stem: "Ombak berkejaran di tepi pantai.\n\nMajas yang digunakan dalam kalimat tersebut adalah ...",
          options: ["metafora", "hiperbola", "simile", "personifikasi", "litotes"],
          answer: "D",
          explanation: "Ombak diberi sifat manusia (berkejaran), sehingga majasnya personifikasi.",
        },
        {
          stem: "Ciri kebahasaan teks prosedur adalah ...",
          options: [
            "menggunakan kalimat perintah",
            "menggunakan kata kerja masa lampau dan nama tokoh",
            "menggunakan banyak majas",
            "menggunakan sudut pandang orang pertama",
            "diawali dengan pantun pembuka",
          ],
          answer: "A",
          explanation: "Teks prosedur berisi langkah-langkah, sehingga banyak memakai kalimat perintah dan kata kerja imperatif.",
        },
        {
          stimulus: binParagraph,
          stem: "Simpulan yang tepat dari paragraf tersebut adalah ...",
          options: [
            "Perpustakaan sekolah kini hanya menyediakan buku fiksi.",
            "Siswa wajib belajar kelompok di perpustakaan.",
            "Perpustakaan sekolah tutup lebih awal daripada sebelumnya.",
            "Ruang diskusi hanya untuk guru.",
            "Perpustakaan sekolah meningkatkan layanannya untuk mendukung kegiatan belajar siswa.",
          ],
          answer: "E",
          explanation: "Ketiga kalimat menyebut peningkatan layanan: jam buka lebih panjang, koleksi bertambah, dan ruang diskusi.",
        },
        {
          stem: "Kata berimbuhan yang ditulis dengan tepat adalah ...",
          options: ["mensukseskan", "mempesona", "mengubah", "merubah", "menterjemahkan"],
          answer: "C",
          explanation: "Bentuk yang benar: menyukseskan, memesona, mengubah, menerjemahkan. Fonem awal k, p, t, s luluh jika mendapat imbuhan me-.",
        },
      ],
    },
    {
      ...TKA.MAT,
      questions: [
        {
          stem: "Nilai x yang memenuhi persamaan 3ˣ⁺¹ = 81 adalah ...",
          options: ["2", "3", "4", "5", "27"],
          answer: "B",
          explanation: "81 = 3⁴, sehingga x + 1 = 4 dan x = 3.",
        },
        {
          stem: "Gradien garis yang melalui titik (1, 2) dan (4, 11) adalah ...",
          options: ["1", "2", "9", "3", "1/3"],
          answer: "D",
          explanation: "m = (11 − 2) ÷ (4 − 1) = 9 ÷ 3 = 3.",
        },
        {
          stem: "Diketahui f(x) = 2x + 3 dan g(x) = x². Nilai (g ∘ f)(1) adalah ...",
          options: ["25", "11", "10", "7", "5"],
          answer: "A",
          explanation: "f(1) = 5, lalu g(5) = 25.",
        },
        {
          stem: "Median dari data 4, 7, 5, 9, 6, 8, 7 adalah ...",
          options: ["6", "6,5", "7", "7,5", "8"],
          answer: "C",
          explanation: "Data terurut: 4, 5, 6, 7, 7, 8, 9. Nilai tengah (data ke-4) adalah 7.",
        },
        {
          stem: "Suku ke-10 dari barisan aritmetika 3, 7, 11, ... adalah ...",
          options: ["35", "37", "43", "40", "39"],
          answer: "E",
          explanation: "U₁₀ = 3 + (10 − 1) × 4 = 39.",
        },
      ],
    },
    {
      ...TKA.BIG,
      questions: [
        {
          stem: "Every morning, my sister ... her bike to school, and she is never late.",
          options: ["ride", "rides", "riding", "ridden", "to ride"],
          answer: "B",
          explanation: "A daily habit with a third-person singular subject takes the simple present with -s: rides.",
        },
        {
          stimulus: bigNotice,
          stem: "What should students do if they want to return books on Friday?",
          options: [
            "Give the books to a teacher",
            "Keep the books until next month",
            "Return the books on Thursday only",
            "Wait at the library door",
            "Put the books in the drop box at the main entrance",
          ],
          answer: "E",
          explanation: "The notice says students may use the drop box at the main entrance.",
        },
        {
          stimulus: bigNotice,
          stem: "Why will the library be closed?",
          options: ["Because of a holiday", "Because of a school event", "For maintenance", "Because the staff are on leave", "For a book sale"],
          answer: "C",
          explanation: "The notice states the library will be closed for maintenance.",
        },
        {
          stem: "If I ... more time, I would join the debate club.",
          options: ["had", "have", "will have", "has", "having"],
          answer: "A",
          explanation: "The second conditional uses if + past simple with would + base verb: If I had more time, I would ...",
        },
        {
          stem: "The new policy was implemented immediately.\n\nThe word \"immediately\" is closest in meaning to ...",
          options: ["gradually", "carefully", "rarely", "at once", "partly"],
          answer: "D",
          explanation: "Immediately means without delay, which is at once.",
        },
      ],
    },
  ],
};
