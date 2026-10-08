// Fictional participants with finished attempts, so the leaderboard isn't empty in the demo.
// They have no password (no credential Account), so nobody can sign in as them.
import { randomUUID } from "node:crypto";

import type { ExamType, PrismaClient } from "../../src/generated/prisma/client";
import { SCORE_SCALE, scoreAttempt } from "../../src/lib/scoring";

const SAMPLE_NAMES = [
  "Adinda Putri",
  "Bagas Pratama",
  "Citra Lestari",
  "Dimas Saputra",
  "Eka Wulandari",
  "Fajar Nugroho",
  "Gita Ramadhani",
  "Hafiz Maulana",
  "Intan Permata",
  "Joko Santoso",
  "Kirana Ayu",
  "Lutfi Hakim",
  "Maya Anggraini",
  "Naufal Rizki",
  "Olivia Hartono",
];

// The first PREMIUM_COUNT sample participants are premium and also take the premium tryouts.
const PREMIUM_COUNT = 10;

export type SeededTryout = {
  id: string;
  examType: ExamType;
  accessTier: "FREE" | "PREMIUM";
  subtests: {
    id: string;
    durationSeconds: number;
    questions: { id: string; weight: number; options: { id: string; isCorrect: boolean }[] }[];
  }[];
};

// A small seeded random generator (mulberry32): every reseed gives the same leaderboard.
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function upsertSampleParticipants(prisma: PrismaClient) {
  return Promise.all(
    SAMPLE_NAMES.map((name, index) => {
      const email = `sample${String(index + 1).padStart(2, "0")}@example.com`;
      const isPremium = index < PREMIUM_COUNT;
      return prisma.user.upsert({
        where: { email },
        update: { name, isPremium },
        create: { id: randomUUID(), name, email, emailVerified: true, role: "PARTICIPANT", isPremium },
        select: { id: true, isPremium: true },
      });
    }),
  );
}

export async function seedSampleAttempts(prisma: PrismaClient, tryouts: SeededTryout[]) {
  const participants = await upsertSampleParticipants(prisma);
  const random = createRandom(2026);
  const now = Date.now();
  let count = 0;

  for (const tryout of tryouts) {
    for (const participant of participants) {
      if (tryout.accessTier === "PREMIUM" && !participant.isPremium) continue;

      // Each participant gets a skill level: the chance of answering a question right.
      const skill = 0.35 + random() * 0.55;
      // Took the tryout sometime in the last two weeks.
      const startedAt = new Date(now - (1 + random() * 13) * 24 * 3600 * 1000);

      // Sections run back to back, like the real timer. Some use the full time (auto-submitted).
      let sectionStart = startedAt;
      let lastUsedFullTime = false;
      const sections = tryout.subtests.map((subtest) => {
        const fraction = random() < 0.2 ? 1 : 0.5 + random() * 0.5;
        const deadline = new Date(sectionStart.getTime() + subtest.durationSeconds * 1000);
        const submittedAt = new Date(sectionStart.getTime() + Math.round(subtest.durationSeconds * fraction) * 1000);
        const section = { subtestId: subtest.id, startedAt: sectionStart, deadline, submittedAt };
        sectionStart = submittedAt;
        lastUsedFullTime = fraction === 1;
        return section;
      });

      // About 8% of questions left blank; otherwise right with probability `skill`, else a random wrong option.
      const selections: Record<string, string | null> = {};
      for (const question of tryout.subtests.flatMap((subtest) => subtest.questions)) {
        if (random() < 0.08) continue;
        const correct = question.options.find((option) => option.isCorrect);
        const wrong = question.options.filter((option) => !option.isCorrect);
        selections[question.id] =
          correct && random() < skill ? correct.id : wrong[Math.floor(random() * wrong.length)].id;
      }

      const result = scoreAttempt({
        scale: SCORE_SCALE[tryout.examType],
        subtestIds: tryout.subtests.map((subtest) => subtest.id),
        questions: tryout.subtests.flatMap((subtest) =>
          subtest.questions.map((question) => ({
            id: question.id,
            subtestId: subtest.id,
            weight: question.weight,
            correctOptionId: question.options.find((option) => option.isCorrect)?.id ?? "",
          })),
        ),
        selections,
      });

      await prisma.attempt.create({
        data: {
          userId: participant.id,
          tryoutId: tryout.id,
          status: "SUBMITTED",
          startedAt,
          submittedAt: sections.at(-1)?.submittedAt,
          autoSubmitted: lastUsedFullTime,
          score: result.score,
          sections: { create: sections.map((section, index) => ({ ...section, score: result.subtests[index].score })) },
          answers: {
            create: Object.entries(selections).map(([questionId, selectedOptionId]) => ({
              questionId,
              selectedOptionId,
              isCorrect: result.isCorrect[questionId],
            })),
          },
        },
      });
      count++;
    }
  }

  console.log(`Sample participants: ${participants.length}, finished attempts: ${count}`);
}
