// Summary numbers for the participant dashboard. Pure, so it's unit tested.
import type { AttemptStatus, ExamType } from "@/generated/prisma/client";

export type HistoryAttempt = { status: AttemptStatus; score: number | null; examType: ExamType };

export type DashboardStats = {
  finished: number;
  inProgress: number;
  // Best score per exam type. UTBK (0–1000) and TKA (0–100) use different scales, so they're never mixed.
  best: Partial<Record<ExamType, number>>;
};

export function summarizeAttempts(attempts: HistoryAttempt[]): DashboardStats {
  const best: Partial<Record<ExamType, number>> = {};
  let finished = 0;
  let inProgress = 0;

  for (const attempt of attempts) {
    if (attempt.status === "IN_PROGRESS") {
      inProgress++;
      continue;
    }
    finished++;
    if (attempt.score === null) continue;
    const current = best[attempt.examType];
    if (current === undefined || attempt.score > current) best[attempt.examType] = attempt.score;
  }

  return { finished, inProgress, best };
}
