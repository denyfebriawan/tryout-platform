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

export type Rank = { rank: number; total: number };

// One participant's rank on every tryout they finished, in a single query (the dashboard), instead of
// two getRank() counts per tryout. RANK() gives equal scores the same rank and skips ahead (1, 2, 2, 4),
// so it agrees with withRanks() and getRank(). The inner filter only ranks tryouts this participant took.
export async function getRanksForUser(userId: string): Promise<Map<string, Rank>> {
  const rows = await prisma.$queryRaw<{ id: string; rank: bigint; total: bigint }[]>`
    SELECT id, rank, total FROM (
      SELECT id, "userId",
        RANK() OVER (PARTITION BY "tryoutId" ORDER BY score DESC) AS rank,
        COUNT(*) OVER (PARTITION BY "tryoutId") AS total
      FROM "Attempt"
      WHERE status = 'SUBMITTED' AND score IS NOT NULL
        AND "tryoutId" IN (SELECT "tryoutId" FROM "Attempt" WHERE "userId" = ${userId})
    ) ranked
    WHERE "userId" = ${userId}`;
  // Postgres returns RANK() and COUNT() as bigint. Both are small, so Number() is safe.
  return new Map(rows.map((row) => [row.id, { rank: Number(row.rank), total: Number(row.total) }]));
}
