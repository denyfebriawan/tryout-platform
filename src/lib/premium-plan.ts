// The premium plan shown on /premium. startPremiumCheckout() charges `priceIdr` through Midtrans.
// One-time payment for the demo: the real model (subscription, per-package) is an open question for the client.
export const premiumPlan = {
  name: "Premium",
  priceIdr: 49_000,
  benefits: [
    "Buka semua tryout UTBK-SNBT dan TKA, termasuk yang baru ditambahkan",
    "Pembahasan untuk setiap soal setelah tryout selesai",
    "Bersaing di leaderboard setiap tryout",
    "Sekali bayar, tanpa langganan",
  ],
};
