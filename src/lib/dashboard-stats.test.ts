import { describe, expect, it } from "vitest";

import { summarizeAttempts } from "./dashboard-stats";

describe("summarizeAttempts", () => {
  it("returns zeros and no best scores for an empty history", () => {
    expect(summarizeAttempts([])).toEqual({ finished: 0, inProgress: 0, best: {} });
  });

  it("counts finished and in-progress attempts separately", () => {
    const stats = summarizeAttempts([
      { status: "SUBMITTED", score: 500, examType: "UTBK" },
      { status: "SUBMITTED", score: 600, examType: "UTBK" },
      { status: "IN_PROGRESS", score: null, examType: "TKA" },
    ]);
    expect(stats.finished).toBe(2);
    expect(stats.inProgress).toBe(1);
  });

  it("keeps the best score per exam type without mixing scales", () => {
    const stats = summarizeAttempts([
      { status: "SUBMITTED", score: 512.5, examType: "UTBK" },
      { status: "SUBMITTED", score: 742.9, examType: "UTBK" },
      { status: "SUBMITTED", score: 80, examType: "TKA" },
    ]);
    expect(stats.best).toEqual({ UTBK: 742.9, TKA: 80 });
  });

  it("ignores in-progress attempts and missing scores for best scores", () => {
    const stats = summarizeAttempts([
      { status: "IN_PROGRESS", score: 900, examType: "UTBK" },
      { status: "SUBMITTED", score: null, examType: "TKA" },
    ]);
    expect(stats.best).toEqual({});
    expect(stats.finished).toBe(1);
  });

  it("counts a score of 0 as a best score", () => {
    expect(summarizeAttempts([{ status: "SUBMITTED", score: 0, examType: "TKA" }]).best).toEqual({ TKA: 0 });
  });
});
