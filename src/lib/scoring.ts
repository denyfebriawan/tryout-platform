// Scoring for a submitted attempt. Pure (no database), so it's unit tested and shared with the seed.
//
// The demo uses simple weighted scoring: each subtest scores (weight of correct answers / total weight)
// on the exam's scale, and the attempt's score is the average of its subtests. Real UTBK uses IRT,
// which weighs questions by how many participants got them right. To switch, replace scoreAttempt():
// its callers only rely on the shape of AttemptScore.
import type { ExamType } from "@/generated/prisma/client";

// UTBK reports each subtest on a 0–1000 scale; TKA reports each subject on 0–100.
export const SCORE_SCALE: Record<ExamType, number> = { UTBK: 1000, TKA: 100 };

export type ScoringQuestion = {
  id: string;
  subtestId: string;
  weight: number;
  correctOptionId: string;
};

export type SubtestScore = {
  subtestId: string;
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
};

export type AttemptScore = {
  score: number;
  subtests: SubtestScore[];
  // Per question: whether the selected option was right. Unanswered counts as not correct.
  isCorrect: Record<string, boolean>;
};

export type ScoringInput = {
  scale: number;
  // In subtest order. A subtest with no questions still gets a score (0), so the average stays honest.
  subtestIds: string[];
  questions: ScoringQuestion[];
  // The participant's selected option per question id. Missing or null means unanswered.
  selections: Record<string, string | null>;
};

// Two decimals is enough to tell scores apart without float noise like 714.2857142857.
const round = (value: number) => Math.round(value * 100) / 100;

export function scoreAttempt({ scale, subtestIds, questions, selections }: ScoringInput): AttemptScore {
  const isCorrect: Record<string, boolean> = {};

  const subtests = subtestIds.map((subtestId): SubtestScore => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    let earnedWeight = 0;
    let totalWeight = 0;

    for (const question of questions) {
      if (question.subtestId !== subtestId) continue;
      const selected = selections[question.id] ?? null;
      const right = selected === question.correctOptionId;
      isCorrect[question.id] = right;
      totalWeight += question.weight;

      if (selected === null) unanswered++;
      else if (right) {
        correct++;
        earnedWeight += question.weight;
      } else wrong++;
    }

    const score = totalWeight === 0 ? 0 : round((earnedWeight / totalWeight) * scale);
    return { subtestId, score, correct, wrong, unanswered };
  });

  const total = subtests.reduce((sum, subtest) => sum + subtest.score, 0);
  const score = subtests.length === 0 ? 0 : round(total / subtests.length);
  return { score, subtests, isCorrect };
}
