// Leaderboard ranks. Pure, so it's unit tested.

// Expects entries already sorted best first (score descending). Equal scores share a rank and the
// next rank skips ahead ("standard competition ranking": 1, 2, 2, 4), the way exam rankings usually work.
export function withRanks<T extends { score: number }>(sorted: T[]): (T & { rank: number })[] {
  let rank = 0;
  return sorted.map((entry, index) => {
    // A new score starts a new rank: its position in the list. A repeated score keeps the previous rank.
    if (index === 0 || entry.score !== sorted[index - 1].score) rank = index + 1;
    return { ...entry, rank };
  });
}
