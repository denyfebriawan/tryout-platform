// Seeds demo users, tryout content, and sample finished attempts for the leaderboard. Run with `npm run db:seed`.
// It deletes all tryouts and attempts first, so it's for development and demo setup only.
// Users are upserted, never deleted. The demo accounts' payments are deleted.
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../../src/generated/prisma/client";
import { demoAccounts } from "../../src/lib/demo-accounts";
import type { OptionLabel, SeedSubtest, SeedTryout } from "./structure";
import { seedSampleAttempts } from "./sample-attempts";
import { tka1 } from "./tka-1";
import { utbk1 } from "./utbk-1";
import { seedDemoUsers } from "./users";
import { utbk2 } from "./utbk-2";

// Can't import src/lib/prisma.ts here: it's marked server-only and throws outside Next.js.
config({ path: ".env.local", quiet: true });
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const LABELS: OptionLabel[] = ["A", "B", "C", "D", "E"];

// Keep the official time per question, scaled to the number of demo questions.
function demoDurationSeconds(subtest: SeedSubtest) {
  const secondsPerQuestion = (subtest.official.minutes * 60) / subtest.official.questions;
  return Math.round(secondsPerQuestion * subtest.questions.length);
}

async function createTryout(tryout: SeedTryout) {
  return prisma.tryout.create({
    data: {
      slug: tryout.slug,
      title: tryout.title,
      description: tryout.description,
      examType: tryout.examType,
      accessTier: tryout.accessTier,
      isPublished: true,
      subtests: {
        create: tryout.subtests.map((subtest, subtestIndex) => ({
          order: subtestIndex + 1,
          code: subtest.code,
          name: subtest.name,
          durationSeconds: demoDurationSeconds(subtest),
          questions: {
            create: subtest.questions.map((question, questionIndex) => ({
              order: questionIndex + 1,
              stimulus: question.stimulus,
              stem: question.stem,
              explanation: question.explanation,
              options: {
                create: question.options.map((text, optionIndex) => ({
                  label: LABELS[optionIndex],
                  text,
                  isCorrect: LABELS[optionIndex] === question.answer,
                })),
              },
            })),
          },
        })),
      },
    },
    // Subtests in order with their questions and answer keys: the sample attempts need them.
    include: {
      subtests: {
        orderBy: { order: "asc" },
        include: { questions: { select: { id: true, weight: true, options: { select: { id: true, isCorrect: true } } } } },
      },
    },
  });
}

async function main() {
  await seedDemoUsers(prisma);

  // Attempts block tryout deletion (onDelete: Restrict), so remove them first.
  // Deleting tryouts cascades to subtests, questions and options.
  // The demo accounts' payments go too, so a reset free account doesn't show a paid payment.
  // Payments of self-registered users are kept.
  await prisma.$transaction([
    prisma.attempt.deleteMany(),
    prisma.tryout.deleteMany(),
    prisma.payment.deleteMany({ where: { user: { email: { in: demoAccounts.map((account) => account.email) } } } }),
  ]);

  const tryouts = [];
  for (const tryout of [utbk1, utbk2, tka1]) {
    const created = await createTryout(tryout);
    tryouts.push(created);
    const questionCount = created.subtests.reduce((sum, s) => sum + s.questions.length, 0);
    const totalMinutes = created.subtests.reduce((sum, s) => sum + s.durationSeconds, 0) / 60;
    console.log(
      `${created.title} [${created.accessTier}]: ${created.subtests.length} subtests, ` +
        `${questionCount} questions, ${totalMinutes.toFixed(1)} min`,
    );
  }

  await seedSampleAttempts(prisma, tryouts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
