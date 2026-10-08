import { type SeedTryout, UTBK } from "./structure";

const ppuText =
  "(1) Penurunan muka tanah di sejumlah kota pesisir semakin mengkhawatirkan. (2) Salah satu penyebab utamanya adalah pengambilan air tanah secara berlebihan untuk kebutuhan rumah tangga dan industri. (3) Ketika air tanah disedot terus-menerus, lapisan tanah kehilangan penopangnya dan perlahan memadat. (4) Akibatnya, permukaan tanah turun beberapa sentimeter setiap tahun. (5) Untuk mengatasinya, pemerintah perlu memperluas jaringan air perpipaan agar ketergantungan pada air tanah berkurang.";

const pbmParagraph =
  "(1) Olahraga teratur memberikan banyak manfaat bagi kesehatan. (2) Aktivitas fisik membantu menjaga berat badan tetap ideal. (3) Selain itu, olahraga dapat memperkuat jantung dan paru-paru. (4) Harga perlengkapan olahraga di pusat perbelanjaan cenderung naik menjelang akhir tahun. (5) Olahraga juga terbukti membantu mengurangi stres.";

const lbiText = [
  "Banyak remaja saat ini tidur kurang dari tujuh jam setiap malam. Padahal, para ahli kesehatan menganjurkan remaja tidur delapan hingga sepuluh jam agar tubuh dan otak dapat berkembang optimal. Salah satu penyebab yang sering disebut adalah penggunaan gawai menjelang tidur. Cahaya biru dari layar diketahui dapat menekan produksi melatonin, hormon yang memberi sinyal kepada tubuh bahwa sudah waktunya beristirahat.",
  "Kurang tidur berdampak lebih luas daripada sekadar rasa kantuk di kelas. Remaja yang kurang tidur cenderung lebih sulit berkonsentrasi, lebih mudah marah, dan memiliki daya ingat yang lebih lemah. Dalam jangka panjang, kebiasaan ini juga dikaitkan dengan risiko gangguan kesehatan mental.",
  "Sejumlah sekolah mulai mengajak orang tua menerapkan aturan sederhana, seperti menjauhkan gawai dari kamar tidur satu jam sebelum waktu tidur. Langkah kecil ini dinilai lebih realistis daripada larangan total penggunaan gawai, yang sulit diterapkan dalam kehidupan sehari-hari.",
].join("\n\n");

const lbeText = [
  "When offices closed during the pandemic, many companies discovered that a large share of their employees could work productively from home. Several years later, the picture is more mixed. Surveys show that most workers value the flexibility of remote work, particularly the time saved by not commuting. Yet many managers worry that new employees, who have never worked side by side with experienced colleagues, miss out on the informal learning that happens in an office.",
  "As a compromise, a growing number of firms have adopted hybrid schedules, asking staff to come in on two or three fixed days a week. Supporters argue that this combines the best of both arrangements. Critics, however, point out that if colleagues choose different office days, employees may commute only to spend the day on video calls.",
].join("\n\n");

const pmText =
  "Tarif parkir mobil di sebuah pusat perbelanjaan adalah Rp5.000 untuk 2 jam pertama dan Rp3.000 untuk setiap jam berikutnya. Bagian dari satu jam dihitung satu jam penuh. Tarif paling tinggi dalam satu hari adalah Rp25.000.";

export const utbk2: SeedTryout = {
  slug: "utbk-snbt-2",
  title: "Tryout UTBK-SNBT #2",
  description: "Tryout premium dengan 7 subtes UTBK-SNBT dan tingkat kesulitan yang sedikit lebih tinggi.",
  examType: "UTBK",
  accessTier: "PREMIUM",
  subtests: [
    {
      ...UTBK.PU,
      questions: [
        {
          stem: "Jika hari hujan, lapangan basah. Jika lapangan basah, pertandingan ditunda. Hari ini pertandingan tidak ditunda.\n\nSimpulan yang tepat adalah ...",
          options: [
            "Hari ini hujan.",
            "Lapangan basah.",
            "Pertandingan dibatalkan.",
            "Hari ini tidak hujan.",
            "Lapangan basah, tetapi hari tidak hujan.",
          ],
          answer: "D",
          explanation: "Dari silogisme: jika hujan, maka pertandingan ditunda. Pertandingan tidak ditunda, sehingga hari tidak hujan (modus tollens).",
        },
        {
          stem: "Bilangan berikutnya dari barisan 2, 6, 12, 20, 30, ... adalah ...",
          options: ["40", "42", "44", "36", "48"],
          answer: "B",
          explanation: "Suku ke-n adalah n(n + 1): 1×2, 2×3, 3×4, 4×5, 5×6. Suku berikutnya 6 × 7 = 42.",
        },
        {
          stem: "Bilangan berikutnya dari barisan 5, 8, 16, 19, 38, ... adalah ...",
          options: ["76", "44", "39", "40", "41"],
          answer: "E",
          explanation: "Polanya bergantian +3 lalu ×2: 5 (+3) 8 (×2) 16 (+3) 19 (×2) 38 (+3) 41.",
        },
        {
          stem: "Andi dapat menyelesaikan sebuah pekerjaan dalam 6 hari, sedangkan Budi dalam 12 hari. Jika mereka bekerja bersama, pekerjaan itu selesai dalam ...",
          options: ["4 hari", "3 hari", "5 hari", "8 hari", "9 hari"],
          answer: "A",
          explanation: "Laju gabungan 1/6 + 1/12 = 3/12 = 1/4 pekerjaan per hari, sehingga selesai dalam 4 hari.",
        },
        {
          stem: "Lima siswa, yaitu P, Q, R, S, dan T, duduk berderet dari kiri ke kanan. T duduk paling kiri dan R duduk paling kanan. Q duduk tepat di sebelah kanan P. S tidak duduk bersebelahan dengan T.\n\nSiswa yang duduk tepat di sebelah kiri R adalah ...",
          options: ["P", "Q", "S", "T", "Tidak dapat ditentukan"],
          answer: "C",
          explanation: "Posisi 2–4 diisi P, Q, S. S tidak boleh di posisi 2 (sebelah T), dan Q harus tepat di kanan P, sehingga urutannya T, P, Q, S, R. Yang di kiri R adalah S.",
        },
      ],
    },
    {
      ...UTBK.PPU,
      questions: [
        {
          stimulus: ppuText,
          stem: "Makna kata penopang pada kalimat (3) adalah ...",
          options: ["penyangga", "pengisi", "penutup", "pengikat", "pelapis"],
          answer: "A",
          explanation: "Penopang berarti sesuatu yang menyangga atau menahan agar tidak turun.",
        },
        {
          stimulus: ppuText,
          stem: "Hubungan antara kalimat (3) dan kalimat (4) adalah ...",
          options: ["pertentangan", "perbandingan", "sebab-akibat", "contoh", "syarat"],
          answer: "C",
          explanation: "Kalimat (3) menyebut penyebab (tanah memadat), dan kalimat (4) yang diawali kata akibatnya menyebut hasilnya (permukaan tanah turun).",
        },
        {
          stimulus: ppuText,
          stem: "Makna imbuhan pada kata mengkhawatirkan dalam kalimat (1) adalah ...",
          options: [
            "merasa khawatir",
            "dikhawatirkan oleh seseorang",
            "sangat khawatir",
            "saling mengkhawatirkan",
            "menimbulkan rasa khawatir",
          ],
          answer: "E",
          explanation: "Imbuhan me-kan pada kata sifat bermakna menyebabkan atau menimbulkan, sehingga mengkhawatirkan berarti menimbulkan rasa khawatir.",
        },
        {
          stimulus: ppuText,
          stem: "Kata berlebihan pada kalimat (2) dapat diganti dengan ...",
          options: ["sembarangan", "melampaui batas", "sementara", "terencana", "bersamaan"],
          answer: "B",
          explanation: "Berlebihan berarti melampaui batas yang wajar.",
        },
        {
          stimulus: ppuText,
          stem: "Gagasan utama paragraf tersebut adalah ...",
          options: [
            "Air perpipaan lebih sehat daripada air tanah.",
            "Industri menggunakan air tanah lebih banyak daripada rumah tangga.",
            "Lapisan tanah memadat seiring waktu.",
            "Pengambilan air tanah berlebihan menyebabkan penurunan muka tanah di kota pesisir.",
            "Kota pesisir perlu membangun tanggul laut.",
          ],
          answer: "D",
          explanation: "Paragraf menjelaskan masalah penurunan muka tanah, penyebabnya, proses terjadinya, dan solusinya. Penyebab utama yang dibahas adalah pengambilan air tanah berlebihan.",
        },
      ],
    },
    {
      ...UTBK.PBM,
      questions: [
        {
          stem: "Kalimat yang TIDAK efektif adalah ...",
          options: [
            "Semua peserta wajib membawa kartu ujian.",
            "Hasil rapat itu akan diumumkan besok pagi.",
            "Banyak para pengunjung yang datang sejak pagi.",
            "Ia menyerahkan laporan itu kepada ketua panitia.",
            "Kegiatan itu diikuti oleh siswa kelas XII.",
          ],
          answer: "C",
          explanation: "Kata banyak dan para sama-sama menyatakan jamak sehingga mubazir. Bentuk efektifnya: Banyak pengunjung yang datang sejak pagi.",
        },
        {
          stem: "Kalimat yang penulisan kata depan dan imbuhannya tepat adalah ...",
          options: [
            "Buku itu diletakkan di atas meja.",
            "Rapat di adakan di ruang guru.",
            "Mereka tinggal dirumah nenek.",
            "Surat itu di kirim kemarin.",
            "Ia menunggu diluar kelas.",
          ],
          answer: "A",
          explanation: "Imbuhan di- ditulis serangkai (diletakkan, diadakan, dikirim), sedangkan kata depan di ditulis terpisah (di atas, di rumah, di luar).",
        },
        {
          stem: "Kata yang baku adalah ...",
          options: ["apotik", "kwalitas", "jadual", "resiko", "frekuensi"],
          answer: "E",
          explanation: "Bentuk baku: apotek, kualitas, jadwal, risiko. Frekuensi sudah baku.",
        },
        {
          stimulus: pbmParagraph,
          stem: "Kalimat yang tidak padu dalam paragraf tersebut adalah ...",
          options: ["kalimat (1)", "kalimat (2)", "kalimat (3)", "kalimat (4)", "kalimat (5)"],
          answer: "D",
          explanation: "Paragraf membahas manfaat olahraga bagi kesehatan, sedangkan kalimat (4) membahas harga perlengkapan olahraga.",
        },
        {
          stem: "Harga bahan bakar naik cukup tinggi bulan ini. ... banyak warga beralih menggunakan sepeda untuk jarak dekat.\n\nUngkapan penghubung yang tepat untuk melengkapi kalimat tersebut adalah ...",
          options: ["Meskipun demikian,", "Oleh karena itu,", "Sebaliknya,", "Selain itu,", "Bahkan,"],
          answer: "B",
          explanation: "Kalimat kedua adalah akibat dari kalimat pertama, sehingga penghubung yang tepat adalah oleh karena itu.",
        },
      ],
    },
    {
      ...UTBK.PK,
      questions: [
        {
          stem: "Nilai dari 2⁵ − 3³ + 4² adalah ...",
          options: ["19", "21", "23", "25", "27"],
          answer: "B",
          explanation: "32 − 27 + 16 = 21.",
        },
        {
          stem: "Jika a : b = 2 : 3 dan b : c = 4 : 5, maka a : c adalah ...",
          options: ["2 : 5", "8 : 12", "10 : 12", "6 : 5", "8 : 15"],
          answer: "E",
          explanation: "Samakan b: a : b = 8 : 12 dan b : c = 12 : 15, sehingga a : c = 8 : 15.",
        },
        {
          stem: "Sebuah barang dijual seharga Rp150.000 dengan keuntungan 25% dari harga beli. Harga beli barang tersebut adalah ...",
          options: ["Rp110.000", "Rp112.500", "Rp120.000", "Rp125.000", "Rp130.000"],
          answer: "C",
          explanation: "Harga jual = 125% × harga beli, sehingga harga beli = 150.000 ÷ 1,25 = Rp120.000.",
        },
        {
          stem: "Jika x₁ dan x₂ adalah akar-akar persamaan x² − 5x + 6 = 0, nilai x₁² + x₂² adalah ...",
          options: ["13", "11", "25", "12", "10"],
          answer: "A",
          explanation: "Akar-akarnya 2 dan 3, sehingga 4 + 9 = 13. Cara lain: (x₁ + x₂)² − 2x₁x₂ = 25 − 12 = 13.",
        },
        {
          stem: "Rata-rata nilai 30 siswa adalah 70. Rata-rata nilai siswa laki-laki 64, sedangkan rata-rata nilai siswa perempuan 73. Banyak siswa laki-laki adalah ...",
          options: ["8", "9", "12", "10", "15"],
          answer: "D",
          explanation: "64L + 73(30 − L) = 2.100, sehingga 2.190 − 9L = 2.100 dan L = 10.",
        },
      ],
    },
    {
      ...UTBK.LBI,
      questions: [
        {
          stimulus: lbiText,
          stem: "Ide pokok paragraf pertama adalah ...",
          options: [
            "Para ahli menganjurkan remaja tidur delapan hingga sepuluh jam.",
            "Cahaya biru dari layar menekan produksi melatonin.",
            "Melatonin adalah hormon yang mengatur waktu istirahat.",
            "Otak remaja berkembang optimal saat tidur.",
            "Banyak remaja kurang tidur, antara lain karena penggunaan gawai menjelang tidur.",
          ],
          answer: "E",
          explanation: "Paragraf pertama membahas kurang tidur pada remaja dan salah satu penyebabnya. Pilihan lain hanya rincian pendukung.",
        },
        {
          stimulus: lbiText,
          stem: "Makna kata menekan pada paragraf pertama adalah ...",
          options: ["mendorong", "menghambat", "mendesak", "memeras", "menindih"],
          answer: "B",
          explanation: "Dalam konteks produksi hormon, menekan berarti menghambat atau mengurangi.",
        },
        {
          stimulus: lbiText,
          stem: "Dampak kurang tidur yang TIDAK disebutkan dalam bacaan adalah ...",
          options: [
            "penurunan nafsu makan",
            "kesulitan berkonsentrasi",
            "mudah marah",
            "daya ingat melemah",
            "risiko gangguan kesehatan mental",
          ],
          answer: "A",
          explanation: "Paragraf kedua menyebut konsentrasi, emosi, daya ingat, dan kesehatan mental, tetapi tidak menyebut nafsu makan.",
        },
        {
          stimulus: lbiText,
          stem: "Mengapa sekolah memilih aturan menjauhkan gawai satu jam sebelum tidur daripada melarang gawai sepenuhnya?",
          options: [
            "Karena orang tua menolak larangan total.",
            "Karena gawai diperlukan untuk belajar di malam hari.",
            "Karena cahaya biru hanya berbahaya pada malam hari.",
            "Karena aturan itu lebih realistis untuk diterapkan sehari-hari.",
            "Karena larangan total sudah pernah gagal di sekolah lain.",
          ],
          answer: "D",
          explanation: "Paragraf ketiga menyebut langkah kecil ini lebih realistis daripada larangan total yang sulit diterapkan.",
        },
        {
          stimulus: lbiText,
          stem: "Sikap penulis terhadap penggunaan gawai menjelang tidur adalah ...",
          options: [
            "mendukung sepenuhnya karena gawai membantu remaja bersantai",
            "tidak peduli karena itu urusan pribadi remaja",
            "menganggapnya salah satu penyebab kurang tidur yang perlu dikendalikan",
            "menganggapnya satu-satunya penyebab kurang tidur",
            "menolak semua bentuk penggunaan gawai oleh remaja",
          ],
          answer: "C",
          explanation: "Penulis menyebut gawai sebagai salah satu penyebab dan mendukung pembatasan yang realistis, bukan larangan total.",
        },
      ],
    },
    {
      ...UTBK.LBE,
      questions: [
        {
          stimulus: lbeText,
          stem: "What is the passage mainly about?",
          options: [
            "Why managers prefer office work",
            "The time workers save by not commuting",
            "How the pandemic closed offices",
            "The advantages and drawbacks of remote and hybrid work",
            "How to organise video calls effectively",
          ],
          answer: "D",
          explanation: "The passage weighs the benefits of remote work against its drawbacks, then discusses hybrid schedules and their critics.",
        },
        {
          stimulus: lbeText,
          stem: "In paragraph 2, \"a compromise\" refers to ...",
          options: [
            "a middle ground between fully remote and fully office-based work",
            "an agreement to reduce salaries",
            "a decision to close offices permanently",
            "a plan to hire more experienced staff",
            "a rule banning video calls",
          ],
          answer: "A",
          explanation: "Hybrid schedules combine some office days and some remote days, which is a middle ground between the two arrangements.",
        },
        {
          stimulus: lbeText,
          stem: "According to the passage, why are many managers worried about remote work?",
          options: [
            "Workers waste time commuting.",
            "Employees are less productive at home.",
            "Offices are too expensive to maintain.",
            "Video calls are unreliable.",
            "New employees may miss informal learning from experienced colleagues.",
          ],
          answer: "E",
          explanation: "Paragraph 1 states that managers worry new employees miss out on the informal learning that happens in an office.",
        },
        {
          stimulus: lbeText,
          stem: "The critics' concern suggests that hybrid schedules work best when ...",
          options: [
            "employees work from home every day",
            "offices provide better video-call equipment",
            "colleagues coordinate which days they come to the office",
            "managers stop holding meetings",
            "commuting times are shorter",
          ],
          answer: "C",
          explanation: "The critics' problem arises when colleagues choose different office days, so coordinating those days would solve it.",
        },
        {
          stimulus: lbeText,
          stem: "The word \"mixed\" in paragraph 1 is closest in meaning to ...",
          options: [
            "confusing",
            "having both positive and negative aspects",
            "completely negative",
            "changing very quickly",
            "shared by everyone",
          ],
          answer: "B",
          explanation: "The paragraph goes on to describe both a benefit (flexibility) and a concern (lost informal learning), so mixed means having both positive and negative aspects.",
        },
      ],
    },
    {
      ...UTBK.PM,
      questions: [
        {
          stimulus: pmText,
          stem: "Seseorang memarkir mobilnya selama 4 jam 20 menit. Biaya parkir yang harus dibayar adalah ...",
          options: ["Rp11.000", "Rp12.000", "Rp14.000", "Rp15.000", "Rp17.000"],
          answer: "C",
          explanation: "2 jam pertama Rp5.000. Sisa 2 jam 20 menit dihitung 3 jam, yaitu 3 × Rp3.000 = Rp9.000. Total Rp14.000.",
        },
        {
          stimulus: pmText,
          stem: "Tarif paling tinggi mulai berlaku jika lama parkir lebih dari ...",
          options: ["8 jam", "7 jam", "9 jam", "6 jam", "10 jam"],
          answer: "A",
          explanation: "Untuk lama parkir lebih dari 7 jam hingga 8 jam: 5.000 + 6 × 3.000 = Rp23.000. Lebih dari 8 jam: 5.000 + 7 × 3.000 = Rp26.000, sehingga dibatasi menjadi Rp25.000.",
        },
        {
          stimulus: pmText,
          stem: "Seseorang membayar parkir Rp17.000. Lama parkir paling lama yang mungkin adalah ...",
          options: ["4 jam", "5 jam", "5 jam 30 menit", "7 jam", "6 jam"],
          answer: "E",
          explanation: "17.000 − 5.000 = 12.000, yaitu 4 jam tambahan. Jadi lama parkir lebih dari 5 jam dan paling lama 6 jam.",
        },
        {
          stem: "Sebuah kolam renang berbentuk balok berukuran 10 m × 5 m × 1,5 m diisi air hingga 80% kapasitasnya. Volume air dalam kolam adalah ...",
          options: ["50.000 liter", "60.000 liter", "62.500 liter", "75.000 liter", "80.000 liter"],
          answer: "B",
          explanation: "Kapasitas 10 × 5 × 1,5 = 75 m³. 80% × 75 = 60 m³ = 60.000 liter.",
        },
        {
          stem: "Banyak bakteri dalam sebuah sampel menjadi dua kali lipat setiap 3 jam. Jika banyak bakteri mula-mula 500, banyak bakteri setelah 12 jam adalah ...",
          options: ["2.000", "4.000", "6.000", "8.000", "16.000"],
          answer: "D",
          explanation: "12 jam berarti 4 kali lipat dua: 500 × 2⁴ = 8.000.",
        },
      ],
    },
  ],
};
