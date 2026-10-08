// Database queries for leaderboards. Ranking itself is the pure withRanks() in ranking.ts.
import "server-only";

import { prisma } from "@/lib/prisma";
import { withRanks } from "@/lib/ranking";

export const LEADERBOARD_SIZE = 50;

// Only submitted attempts are ranked. The (tryoutId, status, score) index on Attempt covers this query.
const ranked = (tryoutId: string) => ({ tryoutId, status: "SUBMITTED" as const, score: { not: null } });

// The top of the leaderboard. Equal scores share a rank; among them, whoever submitted first is listed first.
export async function getLeaderboard(tryoutId: string) {
  const rows = await prisma.attempt.findMany({
    where: ranked(tryoutId),
    orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
    take: LEADERBOARD_SIZE,
    select: { id: true, userId: true, score: true, startedAt: true, submittedAt: true, user: { select: { name: true } } },
  });
  // The where clause excludes null scores, but Prisma's types don't know that.
  return withRanks(rows.map((row) => ({ ...row, score: row.score ?? 0 })));
}

// One participant's rank without loading the whole leaderboard: how many scored strictly higher, plus one.
// Matches withRanks(), so the results page and the leaderboard always agree.
export async function getRank(tryoutId: string, score: number) {
  const [higher, total] = await Promise.all([
    prisma.attempt.count({ where: { ...ranked(tryoutId), score: { gt: score } } }),
    prisma.attempt.count({ where: ranked(tryoutId) }),
  ]);
  return { rank: higher + 1, total };
}
