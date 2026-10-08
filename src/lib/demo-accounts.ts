// Demo logins, created by `npm run db:seed` and shown on the login page so reviewers can try each role.
export const demoAccounts = [
  { label: "Admin", name: "Admin Demo", email: "admin@example.com", password: "admin12345", role: "ADMIN", isPremium: false },
  { label: "Peserta gratis", name: "Peserta Gratis", email: "peserta@example.com", password: "peserta12345", role: "PARTICIPANT", isPremium: false },
  { label: "Peserta premium", name: "Peserta Premium", email: "premium@example.com", password: "premium12345", role: "PARTICIPANT", isPremium: true },
] as const;
