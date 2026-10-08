import { describe, expect, it } from "vitest";

import { withRanks } from "./ranking";
import { scoreAttempt, type ScoringQuestion } from "./scoring";

// Two subtests: "a" has questions a1–a4, "b" has b1–b2. The correct option of question q is "q-ok".
const question = (id: string, subtestId: string, weight = 1): ScoringQuestion => ({
  id,
  subtestId,
  weight,
  correctOptionId: `${id}-ok`,
});
const QUESTIONS = [question("a1", "a"), question("a2", "a"), question("a3", "a"), question("a4", "a"), question("b1", "b"), question("b2", "b")];

describe("scoreAttempt", () => {
  it("scores each subtest on the scale and averages them", () => {
    const result = scoreAttempt({
      scale: 1000,
      subtestIds: ["a", "b"],
      questions: QUESTIONS,
      // a: 3 of 4 right (750). b: 1 of 2 right (500).
      selections: { a1: "a1-ok", a2: "a2-ok", a3: "a3-ok", a4: "wrong", b1: "b1-ok", b2: "wrong" },
    });

    expect(result.subtests).toEqual([
      { subtestId: "a", score: 750, correct: 3, wrong: 1, unanswered: 0 },
      { subtestId: "b", score: 500, correct: 1, wrong: 1, unanswered: 0 },
    ]);
    expect(result.score).toBe(625);
  });

  it("counts unanswered questions as zero, separately from wrong ones", () => {
    const result = scoreAttempt({
      scale: 100,
      subtestIds: ["a"],
      questions: QUESTIONS.filter((q) => q.subtestId === "a"),
      selections: { a1: "a1-ok", a2: null, a3: "wrong" },
    });

    expect(result.subtests[0]).toEqual({ subtestId: "a", score: 25, correct: 1, wrong: 1, unanswered: 2 });
    expect(result.isCorrect).toEqual({ a1: true, a2: false, a3: false, a4: false });
  });

  it("weights questions by their weight", () => {
    const result = scoreAttempt({
      scale: 1000,
      subtestIds: ["a"],
      questions: [question("a1", "a", 3), question("a2", "a", 1)],
      selections: { a1: "a1-ok", a2: "wrong" },
    });

    expect(result.subtests[0].score).toBe(750);
  });

  it("rounds to two decimals", () => {
    const result = scoreAttempt({
      scale: 1000,
      subtestIds: ["a"],
      questions: [question("a1", "a"), question("a2", "a"), question("a3", "a")],
      selections: { a1: "a1-ok" },
    });

    expect(result.subtests[0].score).toBe(333.33);
  });

  it("gives an empty subtest zero instead of dividing by zero", () => {
    const result = scoreAttempt({ scale: 1000, subtestIds: ["a", "empty"], questions: [question("a1", "a")], selections: { a1: "a1-ok" } });

    expect(result.subtests[1].score).toBe(0);
    expect(result.score).toBe(500);
  });
});

describe("withRanks", () => {
  it("gives equal scores the same rank and skips the next one", () => {
    const ranked = withRanks([{ score: 900 }, { score: 800 }, { score: 800 }, { score: 700 }]);

    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 2, 4]);
  });

  it("handles an empty leaderboard", () => {
    expect(withRanks([])).toEqual([]);
  });
});
