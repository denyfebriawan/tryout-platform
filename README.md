# TryoutKu: UTBK-SNBT & TKA tryout platform (demo)

An online tryout platform for Indonesia's university entrance test (UTBK-SNBT) and the national academic test (TKA). Participants take timed practice exams that run like the real thing, get scored on the server, and compare results on a leaderboard. Free accounts get one tryout; a sandbox Midtrans payment upgrades an account to premium and unlocks the rest. Admins create tryouts, subtests and questions from a dashboard.

**Live demo:** <https://tryout-platform-zeta.vercel.app>

## Demo accounts

Created by `npm run db:seed` and listed on the login page.

| Role | Email | Password |
| --- | --- | --- |
| Free participant | `peserta@example.com` | `peserta12345` |
| Premium participant | `premium@example.com` | `premium12345` |
| Admin | `admin@example.com` | `admin12345` |

You can also register a new account. Payments run in Midtrans **sandbox mode**: no real money moves (see [Testing payments](#testing-payments)).

## Features

- **Tryout engine**: subtests run in order, each with its own countdown. Jump to any question, flag questions as doubtful, and get auto-submitted when time runs out. Answers autosave, so a refresh or a dropped connection loses nothing and the timer keeps going.
- **Scoring and results**: per-subtest and total scores (UTBK 0–1000, TKA 0–100), with answer keys and explanations once the attempt is finished.
- **Leaderboard** per tryout, with shared ranks for equal scores.
- **Premium gating**: free tryouts are open to every signed-in user, premium tryouts need a premium account.
- **Payments**: Midtrans Snap (sandbox) checkout, with premium granted by a signature-verified webhook.
- **Admin**: create and edit tryouts, subtests and questions (options A–E), publish and unpublish, reorder subtests.
- **Participant dashboard**: stats, in-progress attempts, history with scores and ranks, recent payments.

## Engineering decisions

- **The server owns the timer.** Each section's start time and deadline live in the database. The browser only displays a countdown; answers after the deadline (plus a small grace period) are rejected, and resuming continues the same clock. Timer rules are a pure, unit-tested module (`src/lib/attempt-timeline.ts`).
- **Answer keys never reach the browser during an attempt.** In-progress queries select options without `isCorrect`, and explanations are only loaded for finished attempts.
- **Scoring sits behind one function** (`scoreAttempt()` in `src/lib/scoring.ts`). The demo uses weighted correct answers; real UTBK uses Item Response Theory, which can replace this function without touching the rest. Scoring runs in the same transaction that marks the attempt submitted, and row locks make sure no answer can be saved after scoring.
- **Premium is granted only by the webhook.** The payment popup's callbacks just navigate to a status page that reads the database. The webhook checks Midtrans's SHA-512 signature, locks the payment row, compares the amount, and is idempotent (a repeated notification changes nothing, and PAID is final).
- **Access control on the server.** Premium checks happen where attempts are created, admin checks run in every admin page and Server Action, and the session is read through one data-access module (`src/lib/session.ts`). Hiding a button is never the only check.
- **Content edits can't corrupt results.** Once a tryout has attempts, its structure (subtests, questions, durations, weights, answer keys) is locked. The lock is race-free: edits take a row lock that conflicts with creating an attempt.

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions, Cache Components) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Better Auth · Midtrans Snap · Vitest · Vercel + Neon

## Running locally

Requirements: Node.js 20+, PostgreSQL, and a free [Midtrans](https://midtrans.com) account for payments (optional: without keys, the premium page says payments aren't configured).

```bash
git clone <this repo> && cd tryout-platform
npm install                      # also generates the Prisma client
cp .env.example .env.local       # then fill in the values (comments in the file explain each one)
createdb -U postgres tryout_platform
npm run db:migrate               # create the tables
npm run db:seed                  # demo users, 3 tryouts, and sample leaderboard attempts
npm run dev                      # http://localhost:3000
```

`npm run db:seed` deletes every tryout and attempt before reseeding, including content created in the admin UI. It also resets the demo accounts (passwords, premium status, and payment history).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:seed` | Wipe and reseed demo content |
| `npm run db:studio` | Browse the database |
| `npm run payment:notify -- <order_id> [status]` | Send a signed Midtrans webhook to the local server |

## Testing payments

1. Sign in as `peserta@example.com`, open **Premium**, and click the pay button. The Midtrans Snap popup opens.
2. Pay with a sandbox method. For example, card `4811 1111 1111 1114`, any future expiry date, CVV `123`, OTP `112233`. For virtual accounts and e-wallets, use the [Midtrans sandbox simulator](https://simulator.sandbox.midtrans.com). More test values are in the [Midtrans docs](https://docs.midtrans.com/docs/testing-payment-on-sandbox).
3. Midtrans sends a notification to the webhook, which marks the payment paid and upgrades the account. The status page updates by itself.

Midtrans can't reach `localhost`, so locally the webhook never arrives on its own. Send a correctly signed one yourself:

```bash
npm run payment:notify -- PREMIUM-<uuid>              # settlement (paid)
npm run payment:notify -- PREMIUM-<uuid> expire       # or pending | cancel | deny
```

The order id (`PREMIUM-...`) is shown on the payment status page and on the dashboard. The long number in the Snap popup is the virtual account number, not the order id.

## Deploying (Vercel + Neon)

1. **Database.** Create a Neon project, ideally in Singapore (`aws-ap-southeast-1`) next to the Vercel functions (`vercel.json` pins them to `sin1`). Copy two connection strings: the **pooled** one (host contains `-pooler`) for the app, and the **direct** one for migrations.
2. **Migrate and seed once**, from your machine, against the direct connection string. An environment variable set in the shell takes precedence over `.env.local`:

   ```bash
   # bash
   DATABASE_URL="<neon direct url>" npm run db:deploy
   DATABASE_URL="<neon direct url>" npm run db:seed
   ```

   ```powershell
   # PowerShell
   $env:DATABASE_URL = "<neon direct url>"; npm run db:deploy; npm run db:seed; Remove-Item Env:DATABASE_URL
   ```

   Don't re-run the seed on a live demo casually: it wipes all tryouts and attempts. The exception is resetting the demo on purpose: the demo logins are public, so anyone can edit content as the admin or change a demo password. Run the same seed command before showing the demo to bring it back to a clean state.
3. **Vercel.** Import the repository and add the environment variables from `.env.example`: `DATABASE_URL` (pooled), `BETTER_AUTH_SECRET` (a new random value), `BETTER_AUTH_URL` (the production URL, e.g. `https://your-app.vercel.app`), and the Midtrans sandbox keys. The Prisma client is generated during `npm install` by the `postinstall` script.
4. **Midtrans.** In the sandbox dashboard, set the Payment Notification URL to `https://<your domain>/api/payments/midtrans/notification`.

Sign-in only works on the URL in `BETTER_AUTH_URL`, so preview deployments with other URLs can't sign in.

## Project structure

```text
prisma/
  schema.prisma          data model
  migrations/            SQL migrations
  seed/                  demo users, tryout content (official subtest structure), sample attempts
scripts/                 local webhook simulator
src/
  app/                   routes: landing, auth, tryouts, attempts, dashboard, premium, admin, API
  components/            shared UI
  lib/                   domain logic, Server Actions, data access
    *.test.ts            unit tests for the pure modules (timer, scoring, access, payments, forms, stats)
```

## Roadmap

Planned for phase 2, not built in this demo:

- Video on demand (UTBK tips and tricks)
- Event and tutoring course catalog
- Interest and aptitude test
- Question images and math formulas (LaTeX), bulk import from Excel
- More question types (complex multiple choice, short answer)
- IRT scoring

Sample questions were written for this demo. They aren't taken from any paid question bank.
