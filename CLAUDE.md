# Tryout Platform (demo)

## What this project is

A **demo** of an online UTBK & TKA tryout platform, built to support a freelance bid that has **not been won yet**. It doubles as a portfolio piece for the user's job hunt, so it must be good enough to show in interviews.

- Use a **generic product name**. Never use the client's name or branding.
- Timebox: roughly **5–7 working days** for the demo. Prefer finishing the core flows well over covering everything.
- The folder is empty on purpose. Nothing has been scaffolded yet.

## Client's full requirement list (original wording)

- Tryout UTBK & TKA
- Dashboard Admin & Peserta
- Leaderboard Tryout
- Tes Minat Bakat/Asesmen
- Payment Gateway
- Pembatasan Fitur Premium
- Video On Demand Tips & Trik UTBK
- Katalog Event & Bimbel

## Demo scope

**In scope (build these):**

1. **Tryout engine**: countdown timer, per-subtest sections, question navigation (jump, flag as doubtful), auto-submit when time runs out.
2. **Scoring + leaderboard** per tryout.
3. **Premium gating**: free users get 1 tryout, premium users get all.
4. **Payment in sandbox mode** (test mode only, no real money) that upgrades a user to premium.
5. **Simple admin**: create tryouts, subtests, and questions.
6. **Participant dashboard**: tryout history and scores.

**Out of scope for the demo (Phase 2, describe in the proposal only):**
video on demand, event & course catalog, aptitude/interest test.

Don't build out-of-scope features unless the user asks. A placeholder page is fine if it helps the demo's navigation look complete.

## Open questions for the client (don't assume answers)

- **Scoring**: real UTBK uses IRT (Item Response Theory). The demo uses simple scoring (weighted correct answers), but keep scoring behind one function or module so IRT can replace it later.
- Aptitude test instrument (RIASEC/Holland or their own?).
- Video download protection (simple embed vs. Bunny Stream / Mux).
- Expected concurrent users during a tryout.
- Question input: one by one, or bulk import from Excel? Images / math formulas (LaTeX)?
- Payment model: one-time, subscription, or per-tryout package?

## Domain notes

- UTBK-SNBT has 7 subtests: Penalaran Umum, Pengetahuan & Pemahaman Umum, Pemahaman Bacaan & Menulis, Pengetahuan Kuantitatif (together "TPS"), Literasi Bahasa Indonesia, Literasi Bahasa Inggris, Penalaran Matematika.
- TKA = Tes Kemampuan Akademik (national academic test from Kemendikdasmen).
- **Check the current official structure, timing, and question counts before seeding data.** Don't rely on memory, because the format changes year to year.
- Seed data should be realistic sample questions written for the demo, never copied from paid question banks.

## Proposed tech stack (confirm with the user before scaffolding)

- Next.js (latest stable, App Router) + TypeScript
- Tailwind CSS
- PostgreSQL (local via Docker, or Neon) + Prisma
- Better Auth for authentication
- Midtrans Snap in sandbox mode for payments
- Deploy target: Vercel + Neon

Not a git repo yet. Run `git init` as part of scaffolding.

## Engineering rules

These are the details that make the demo credible. Keep to them even in a demo.

- **The server owns the timer.** Store the attempt's start time and deadline in the database. The client only displays the countdown. Reject submissions after the deadline (with a small grace period).
- **Never send answer keys or explanations to the client** while an attempt is in progress.
- **Autosave answers** as the participant goes, so a refresh or disconnect doesn't lose work. Resuming an attempt continues the same timer.
- **Score on the server only.**
- **Premium checks run on the server** (in Server Components, Server Actions, and route handlers). Hiding a button is not access control.
- **Payment webhooks**: verify Midtrans's signature, make the handler idempotent (the same notification can arrive more than once), and grant premium only from the webhook, never from the client redirect.
- **Role checks** (admin vs. participant) on every admin route and action.
- Keep secrets in `.env.local`, commit a `.env.example`, and never commit real keys.

## Milestones

- [ ] 1. Scaffold: Next.js, Tailwind, Prisma, Postgres, git init
- [ ] 2. Database schema + seed data (1 free tryout, 2 premium tryouts)
- [ ] 3. Auth + roles (admin / participant)
- [ ] 4. Tryout engine (timer, navigation, autosave, auto-submit)
- [ ] 5. Scoring + results page + leaderboard
- [ ] 6. Premium gating
- [ ] 7. Midtrans sandbox payment + webhook
- [ ] 8. Admin CRUD for tryouts and questions
- [ ] 9. Participant dashboard
- [ ] 10. Polish, landing page, deploy, README with demo credentials

Update the checkboxes as milestones finish.

## Working with this user

The user's global CLAUDE.md applies: write the code, explain every line, and treat App Router concepts (Server vs. Client Components, Server Actions) as new material. In addition:

- Work **one milestone at a time** and pause at the end of each so the user can review and ask questions.
- When a decision matters for interviews (e.g., why the timer lives on the server), say so in one line, because the user will need to defend it.
