import { type SeedTryout, UTBK } from "./structure";

const ppuText =
  "(1) Pemerintah daerah mulai menggalakkan penggunaan transportasi umum untuk mengurangi kemacetan. (2) Salah satu langkahnya adalah menambah armada bus listrik pada rute-rute padat. (3) Selain ramah lingkungan, bus listrik juga memiliki biaya operasional yang lebih rendah dalam jangka panjang. (4) Namun, investasi awal untuk pengadaan bus dan stasiun pengisian daya tergolong besar. (5) Oleh karena itu, pemerintah menggandeng pihak swasta melalui skema kerja sama.";

const lbiText = [
  "Dalam lima tahun terakhir, jumlah pelaku usaha mikro yang memasarkan produknya melalui platform digital meningkat pesat. Sebuah survei mencatat bahwa tujuh dari sepuluh pelaku usaha mikro di perkotaan telah memiliki toko daring. Peningkatan ini tidak lepas dari kemudahan membuka toko daring yang hampir tanpa biaya.",
  "Meskipun demikian, kehadiran di platform digital tidak serta-merta meningkatkan penjualan. Banyak pelaku usaha yang tokonya sepi pembeli karena foto produk kurang menarik, deskripsi seadanya, dan respons yang lambat terhadap pertanyaan calon pembeli. Persaingan harga yang ketat juga membuat keuntungan semakin tipis.",
  "Para pengamat menilai bahwa pelatihan pemasaran digital perlu difokuskan bukan hanya pada cara membuka toko, melainkan juga pada cara mengelolanya secara berkelanjutan. Tanpa itu, digitalisasi usaha mikro hanya akan menjadi angka statistik tanpa dampak nyata bagi kesejahteraan pelakunya.",
].join("\n\n");

const lbeText = [
  "Urban heat islands are areas within cities that are significantly warmer than the surrounding countryside. The main cause is the replacement of natural land cover with concrete, asphalt, and buildings, which absorb heat during the day and release it slowly at night. As a result, night-time temperatures in dense city centres can be several degrees higher than in nearby villages.",
  "Rising temperatures are not merely uncomfortable. They increase electricity demand for air conditioning, worsen air quality, and put vulnerable groups, such as the elderly, at greater health risk. Some cities have responded by planting trees along streets, installing reflective \"cool roofs\", and turning unused lots into small parks. Early results suggest that these measures can lower local surface temperatures, although their effect depends on how widely they are applied.",
].join("\n\n");

const pmText =
  "Sebuah toko roti menjual roti tawar seharga Rp18.000 per bungkus dan roti manis seharga Rp12.000 per bungkus. Biaya produksi roti tawar Rp11.000 per bungkus, sedangkan roti manis Rp7.000 per bungkus. Setiap hari toko memproduksi paling banyak 120 bungkus roti dengan modal paling banyak Rp1.000.000.";

export const utbk1: SeedTryout = {
  slug: "utbk-snbt-1",
  title: "Tryout UTBK-SNBT #1",
  description: "Tryout gratis dengan 7 subtes UTBK-SNBT. Cocok untuk mengenal format ujian dan mengukur kemampuan awal.",
  examType: "UTBK",
  accessTier: "FREE",
  subtests: [
    {
      ...UTBK.PU,
      questions: [
        {
          stem: "Semua peserta yang lolos seleksi berkas mengikuti wawancara. Sebagian peserta wawancara berasal dari luar kota. Rina tidak mengikuti wawancara.\n\nSimpulan yang tepat adalah ...",
          options: [
            "Rina berasal dari luar kota.",
            "Rina lolos seleksi berkas.",
            "Rina tidak lolos seleksi berkas.",
            "Rina berasal dari dalam kota.",
            "Tidak ada simpulan yang dapat ditarik tentang Rina.",
          ],
          answer: "C",
          explanation: "Jika lolos berkas, maka ikut wawancara. Rina tidak ikut wawancara, sehingga Rina tidak lolos berkas (modus tollens). Asal daerah Rina tidak dapat disimpulkan.",
        },
        {
          stem: "Bilangan berikutnya dari barisan 3, 6, 11, 18, 27, ... adalah ...",
          options: ["38", "36", "40", "37", "39"],
          answer: "A",
          explanation: "Selisih antarsuku adalah 3, 5, 7, 9, sehingga selisih berikutnya 11. Jadi, 27 + 11 = 38.",
        },
        {
          stem: "Huruf berikutnya dari pola A, C, F, J, O, ... adalah ...",
          options: ["T", "U", "V", "S", "W"],
          answer: "B",
          explanation: "Urutan huruf: A(1), C(3), F(6), J(10), O(15). Selisihnya 2, 3, 4, 5, sehingga berikutnya 15 + 6 = 21, yaitu U.",
        },
        {
          stem: "Harga 3 buku dan 2 pensil adalah Rp27.000. Harga 1 buku dan 2 pensil adalah Rp13.000. Harga 1 buku adalah ...",
          options: ["Rp5.000", "Rp6.000", "Rp6.500", "Rp7.000", "Rp8.000"],
          answer: "D",
          explanation: "Kurangkan kedua persamaan: (3b + 2p) − (b + 2p) = 27.000 − 13.000, sehingga 2b = 14.000 dan b = 7.000.",
        },
        {
          stimulus: "Kota X menerapkan kebijakan ganjil-genap di jalan utama. Sebulan kemudian, volume kendaraan di jalan utama turun 20%, sedangkan volume kendaraan di jalan alternatif di sekitarnya naik 35%.",
          stem: "Berdasarkan informasi tersebut, pernyataan yang paling mungkin benar adalah ...",
          options: [
            "Kemacetan di seluruh kota X pasti berkurang.",
            "Jumlah kendaraan di kota X turun 20%.",
            "Kebijakan ganjil-genap gagal total.",
            "Jalan alternatif tidak terdampak kebijakan.",
            "Sebagian pengendara mengalihkan rute ke jalan alternatif.",
          ],
          answer: "E",
          explanation: "Penurunan di jalan utama yang disertai kenaikan di jalan alternatif paling masuk akal dijelaskan oleh pengalihan rute. Pilihan lain menyimpulkan terlalu jauh dari data.",
        },
      ],
    },
    {
      ...UTBK.PPU,
      questions: [
        {
          stimulus: ppuText,
          stem: "Makna kata menggalakkan pada kalimat (1) adalah ...",
          options: ["memperkenalkan", "menggiatkan", "mewajibkan", "membatasi", "mempertimbangkan"],
          answer: "B",
          explanation: "Menggalakkan berarti menggiatkan atau mendorong supaya lebih giat.",
        },
        {
          stimulus: ppuText,
          stem: "Hubungan antara kalimat (3) dan kalimat (4) adalah ...",
          options: ["sebab-akibat", "penambahan", "pertentangan", "kesimpulan", "contoh"],
          answer: "C",
          explanation: "Kalimat (3) menyebut keunggulan bus listrik, sedangkan kalimat (4) yang diawali kata namun menyebut kelemahannya. Hubungannya pertentangan.",
        },
        {
          stimulus: ppuText,
          stem: "Kata armada pada kalimat (2) bermakna ...",
          options: [
            "kumpulan kendaraan yang dioperasikan bersama",
            "pangkalan kendaraan umum",
            "jalur perjalanan kendaraan",
            "pengemudi kendaraan umum",
            "jadwal keberangkatan kendaraan",
          ],
          answer: "A",
          explanation: "Dalam konteks ini, armada berarti kumpulan kendaraan (bus) yang dioperasikan oleh satu pihak.",
        },
        {
          stimulus: ppuText,
          stem: "Gagasan utama paragraf tersebut adalah ...",
          options: [
            "Bus listrik lebih murah daripada bus biasa.",
            "Pihak swasta berperan besar dalam pengadaan bus.",
            "Investasi bus listrik terlalu mahal bagi pemerintah daerah.",
            "Upaya pemerintah daerah mengurangi kemacetan melalui bus listrik.",
            "Kemacetan disebabkan oleh kurangnya armada bus.",
          ],
          answer: "D",
          explanation: "Seluruh kalimat membahas langkah pemerintah daerah mengurangi kemacetan lewat transportasi umum, khususnya bus listrik. Pilihan lain hanya bagian kecil atau tidak disebutkan.",
        },
        {
          stimulus: ppuText,
          stem: "Makna kata menggandeng pada kalimat (5) adalah ...",
          options: ["menarik", "menyerahkan", "mengawasi", "membiayai", "mengajak bekerja sama"],
          answer: "E",
          explanation: "Dalam kalimat (5), menggandeng berarti mengajak bekerja sama, sesuai dengan frasa skema kerja sama.",
        },
      ],
    },
    {
      ...UTBK.PBM,
      questions: [
        {
          stem: "Kalimat yang efektif adalah ...",
          options: [
            "Para siswa-siswa berkumpul di aula.",
            "Bagi peserta yang terlambat tidak diperkenankan masuk.",
            "Peserta yang terlambat tidak diperkenankan masuk ruang ujian.",
            "Menurut kepala sekolah mengatakan bahwa ujian diundur.",
            "Kami saling bantu-membantu menyelesaikan tugas.",
          ],
          answer: "C",
          explanation: "Pilihan C memiliki subjek dan predikat yang jelas. A dan E mubazir (para + bentuk ulang, saling + bantu-membantu), sedangkan B dan D kehilangan subjek karena diawali kata depan.",
        },
        {
          stem: "Kalimat yang menggunakan kata baku adalah ...",
          options: [
            "Kami sudah merubah jadwal kegiatan.",
            "Data itu dianalisa oleh tim peneliti.",
            "Panitia telah mengkoordinir seluruh peserta.",
            "Ia mempraktikkan teknik pernapasan setiap pagi.",
            "Sekolah itu menerapkan sistim baru.",
          ],
          answer: "D",
          explanation: "Bentuk baku: mengubah, dianalisis, mengoordinasi, sistem. Mempraktikkan dan pernapasan sudah baku.",
        },
        {
          stem: "Kalimat yang penggunaan tanda bacanya tepat adalah ...",
          options: [
            "Ibu membeli: sayur, buah, dan ikan.",
            "Ia bertanya, \"Kapan ujian dimulai?\"",
            "Jika hujan turun kami akan menunda acara.",
            "Adik membeli buku, pensil dan penghapus.",
            "Rapat itu dihadiri oleh: ketua, sekretaris, dan bendahara.",
          ],
          answer: "B",
          explanation: "Petikan langsung diawali koma dan diapit tanda petik. Titik dua tidak dipakai jika rincian merupakan pelengkap kalimat (A, E), anak kalimat di depan perlu koma (C), dan rincian memakai koma sebelum dan (D).",
        },
        {
          stem: "Jalan menuju desa itu rusak parah ... truk pengangkut hasil panen tidak dapat melintas.\n\nKata penghubung yang tepat untuk melengkapi kalimat tersebut adalah ...",
          options: ["sehingga", "meskipun", "agar", "padahal", "namun"],
          answer: "A",
          explanation: "Kalimat menyatakan akibat dari jalan yang rusak, sehingga konjungsi yang tepat adalah sehingga.",
        },
        {
          stem: "Kalimat yang penulisan huruf kapitalnya tepat adalah ...",
          options: [
            "Ia lahir di kota bandung.",
            "Ia membaca novel karya pramoedya ananta toer.",
            "Saya membaca novel Laskar pelangi.",
            "Mereka berlibur ke Danau toba.",
            "Paman tinggal di Jalan Merdeka Nomor 10, Surabaya.",
          ],
          answer: "E",
          explanation: "Nama jalan dan kota ditulis kapital. Bentuk yang benar untuk pilihan lain: Bandung, Pramoedya Ananta Toer, Laskar Pelangi, Danau Toba.",
        },
      ],
    },
    {
      ...UTBK.PK,
      questions: [
        {
          stem: "Jika 2x − 5 = 11, nilai 3x + 1 adalah ...",
          options: ["22", "25", "24", "27", "26"],
          answer: "B",
          explanation: "2x = 16, sehingga x = 8. Maka 3(8) + 1 = 25.",
        },
        {
          stem: "Rata-rata empat bilangan adalah 15. Jika satu bilangan ditambahkan, rata-ratanya menjadi 16. Bilangan yang ditambahkan adalah ...",
          options: ["16", "18", "19", "20", "21"],
          answer: "D",
          explanation: "Jumlah awal 4 × 15 = 60. Jumlah baru 5 × 16 = 80. Bilangan yang ditambahkan 80 − 60 = 20.",
        },
        {
          stem: "Perbandingan uang Andi dan Budi adalah 3 : 5. Jika selisih uang mereka Rp40.000, jumlah uang mereka adalah ...",
          options: ["Rp160.000", "Rp120.000", "Rp140.000", "Rp180.000", "Rp200.000"],
          answer: "A",
          explanation: "Selisih 2 bagian = Rp40.000, sehingga 1 bagian = Rp20.000. Jumlah 8 bagian = Rp160.000.",
        },
        {
          stem: "Sebuah kotak berisi 4 bola merah dan 6 bola biru. Jika diambil 2 bola sekaligus secara acak, peluang terambil keduanya merah adalah ...",
          options: ["4/25", "1/5", "2/5", "6/25", "2/15"],
          answer: "E",
          explanation: "C(4,2) / C(10,2) = 6 / 45 = 2/15.",
        },
        {
          stem: "Sebuah persegi panjang memiliki keliling 30 cm dan panjang 9 cm. Luas persegi panjang tersebut adalah ...",
          options: ["45 cm²", "48 cm²", "54 cm²", "56 cm²", "60 cm²"],
          answer: "C",
          explanation: "2(9 + l) = 30, sehingga l = 6. Luas = 9 × 6 = 54 cm².",
        },
      ],
    },
    {
      ...UTBK.LBI,
      questions: [
        {
          stimulus: lbiText,
          stem: "Ide pokok paragraf kedua adalah ...",
          options: [
            "Platform digital menyediakan toko daring secara gratis.",
            "Kehadiran di platform digital belum tentu meningkatkan penjualan.",
            "Persaingan harga menguntungkan pembeli.",
            "Pelaku usaha memerlukan fotografer profesional.",
            "Survei menunjukkan peningkatan jumlah toko daring.",
          ],
          answer: "B",
          explanation: "Kalimat pertama paragraf kedua menyatakan bahwa kehadiran di platform digital tidak serta-merta meningkatkan penjualan. Kalimat sesudahnya menjelaskan alasannya.",
        },
        {
          stimulus: lbiText,
          stem: "Pernyataan yang sesuai dengan pendapat para pengamat dalam bacaan adalah ...",
          options: [
            "Pelatihan pemasaran digital perlu mencakup cara mengelola toko secara berkelanjutan.",
            "Digitalisasi usaha mikro tidak memberikan manfaat apa pun.",
            "Pelaku usaha mikro sebaiknya kembali berjualan secara luring.",
            "Pemerintah perlu membatasi jumlah toko daring.",
            "Pelatihan cara membuka toko daring sudah tidak diperlukan.",
          ],
          answer: "A",
          explanation: "Paragraf ketiga menyebut pelatihan perlu difokuskan bukan hanya pada cara membuka toko, melainkan juga cara mengelolanya secara berkelanjutan.",
        },
        {
          stimulus: lbiText,
          stem: "Makna frasa serta-merta pada paragraf kedua adalah ...",
          options: ["perlahan-lahan", "dengan sengaja", "secara bersamaan", "seketika; langsung", "secara kebetulan"],
          answer: "D",
          explanation: "Serta-merta berarti seketika itu juga atau langsung.",
        },
        {
          stimulus: lbiText,
          stem: "Pernyataan berikut yang TIDAK sesuai dengan isi bacaan adalah ...",
          options: [
            "Sebagian besar usaha mikro di perkotaan sudah memiliki toko daring.",
            "Respons yang lambat dapat membuat toko daring sepi pembeli.",
            "Persaingan harga membuat keuntungan pelaku usaha menipis.",
            "Pelatihan selama ini cenderung berfokus pada cara membuka toko.",
            "Membuka toko daring memerlukan biaya yang besar.",
          ],
          answer: "E",
          explanation: "Paragraf pertama justru menyebut membuka toko daring hampir tanpa biaya.",
        },
        {
          stimulus: lbiText,
          stem: "Hubungan isi paragraf pertama dan paragraf kedua adalah ...",
          options: [
            "Paragraf kedua memberikan contoh dari paragraf pertama.",
            "Paragraf kedua menyimpulkan paragraf pertama.",
            "Paragraf kedua menunjukkan sisi lain dari fenomena di paragraf pertama.",
            "Paragraf kedua mengulang isi paragraf pertama.",
            "Paragraf kedua menjelaskan penyebab peningkatan di paragraf pertama.",
          ],
          answer: "C",
          explanation: "Paragraf pertama menyajikan peningkatan jumlah toko daring, sedangkan paragraf kedua (diawali meskipun demikian) menunjukkan bahwa peningkatan itu belum berarti penjualan naik.",
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
            "Urban heat islands, their effects, and how cities are responding to them",
            "The health problems faced by elderly people in cities",
            "The rising cost of air conditioning in dense city centres",
            "Why villages are cooler than cities during the day",
            "The benefits of turning unused lots into parks",
          ],
          answer: "A",
          explanation: "The first paragraph defines urban heat islands and their cause. The second covers their effects and the measures cities are taking. The other options cover only one detail.",
        },
        {
          stimulus: lbeText,
          stem: "The word \"vulnerable\" in paragraph 2 is closest in meaning to ...",
          options: ["wealthy", "resistant", "susceptible", "careless", "independent"],
          answer: "C",
          explanation: "Vulnerable means easily harmed, which matches susceptible.",
        },
        {
          stimulus: lbeText,
          stem: "According to the passage, why are night-time temperatures higher in city centres?",
          options: [
            "Cities receive more sunlight than villages.",
            "Air conditioners release heat into the streets.",
            "There are more vehicles at night.",
            "Built surfaces release the heat they absorbed during the day slowly.",
            "Trees in cities trap warm air.",
          ],
          answer: "D",
          explanation: "Paragraph 1 says concrete, asphalt and buildings absorb heat during the day and release it slowly at night.",
        },
        {
          stimulus: lbeText,
          stem: "Which of the following is NOT mentioned as an effect of rising urban temperatures?",
          options: [
            "Higher demand for electricity",
            "Reduced rainfall",
            "Worse air quality",
            "Greater health risks for the elderly",
            "Discomfort for residents",
          ],
          answer: "B",
          explanation: "The passage mentions electricity demand, air quality, health risks and discomfort, but not rainfall.",
        },
        {
          stimulus: lbeText,
          stem: "What is the author's attitude towards the measures taken by some cities?",
          options: ["Dismissive", "Indifferent", "Hostile", "Extremely enthusiastic", "Cautiously optimistic"],
          answer: "E",
          explanation: "The author reports that early results are positive but adds that the effect depends on how widely the measures are applied.",
        },
      ],
    },
    {
      ...UTBK.PM,
      questions: [
        {
          stimulus: pmText,
          stem: "Jika pada suatu hari terjual 40 bungkus roti tawar dan 60 bungkus roti manis, keuntungan toko pada hari itu adalah ...",
          options: ["Rp520.000", "Rp560.000", "Rp580.000", "Rp600.000", "Rp620.000"],
          answer: "C",
          explanation: "Untung per bungkus: roti tawar Rp7.000, roti manis Rp5.000. Total: 40 × 7.000 + 60 × 5.000 = Rp580.000.",
        },
        {
          stimulus: pmText,
          stem: "Jika toko hanya memproduksi roti tawar dengan modal maksimum, banyak roti tawar paling banyak yang dapat diproduksi adalah ...",
          options: ["83 bungkus", "100 bungkus", "91 bungkus", "120 bungkus", "90 bungkus"],
          answer: "E",
          explanation: "1.000.000 ÷ 11.000 ≈ 90,9. Jumlah bungkus harus bilangan bulat, jadi paling banyak 90 bungkus.",
        },
        {
          stimulus: pmText,
          stem: "Pada suatu hari toko memproduksi tepat 120 bungkus roti dengan modal tepat Rp1.000.000. Banyak roti tawar yang diproduksi adalah ...",
          options: ["40 bungkus", "30 bungkus", "35 bungkus", "45 bungkus", "50 bungkus"],
          answer: "A",
          explanation: "Misalkan roti tawar x. 11.000x + 7.000(120 − x) = 1.000.000, sehingga 4.000x = 160.000 dan x = 40.",
        },
        {
          stem: "Sebuah tangki air berbentuk tabung dengan jari-jari 0,7 m dan tinggi 2 m terisi penuh. Air dialirkan keluar dengan debit 14 liter per menit. Waktu yang diperlukan hingga tangki kosong adalah ... (π = 22/7)",
          options: ["180 menit", "200 menit", "210 menit", "220 menit", "240 menit"],
          answer: "D",
          explanation: "Volume = 22/7 × 0,7² × 2 = 3,08 m³ = 3.080 liter. Waktu = 3.080 ÷ 14 = 220 menit.",
        },
        {
          stem: "Harga sebuah sepatu dinaikkan 20%, kemudian diberi diskon 20%. Dibandingkan harga awal, harga akhir sepatu ...",
          options: ["sama", "turun 4%", "naik 4%", "turun 2%", "naik 2%"],
          answer: "B",
          explanation: "1,2 × 0,8 = 0,96, sehingga harga akhir 96% dari harga awal atau turun 4%.",
        },
      ],
    },
  ],
};
