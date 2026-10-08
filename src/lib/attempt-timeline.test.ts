import { describe, expect, it } from "vitest";

import { acceptsAnswers, ANSWER_GRACE_MS, buildTimeline, type SectionTiming } from "./attempt-timeline";

const START = new Date("2026-10-09T08:00:00Z");

// Seconds after START, as a Date.
const at = (seconds: number) => new Date(START.getTime() + seconds * 1000);

// Three sections of 100, 200 and 300 seconds, none written to the database yet.
function sections(overrides: Partial<SectionTiming>[] = []): SectionTiming[] {
  return [100, 200, 300].map((durationSeconds, index) => ({
    id: `s${index + 1}`,
    durationSeconds,
    startedAt: null,
    deadline: null,
    submittedAt: null,
    ...overrides[index],
  }));
}

describe("buildTimeline", () => {
  it("opens the first section when the attempt starts", () => {
    const timeline = buildTimeline(START, sections(), at(0));

    expect(timeline.active?.id).toBe("s1");
    expect(timeline.active?.deadline).toEqual(at(100));
    expect(timeline.sections.map((s) => s.state)).toEqual(["active", "upcoming", "upcoming"]);
    expect(timeline.finished).toBe(false);
  });

  it("chains sections back to back when time runs out", () => {
    const timeline = buildTimeline(START, sections(), at(150));

    expect(timeline.active?.id).toBe("s2");
    expect(timeline.active?.startedAt).toEqual(at(100));
    expect(timeline.active?.deadline).toEqual(at(300));
    expect(timeline.sections[0].endedEarly).toBe(false);
  });

  it("starts the next section as soon as one is submitted early", () => {
    const timeline = buildTimeline(START, sections([{ submittedAt: at(40) }]), at(50));

    expect(timeline.sections[0]).toMatchObject({ state: "done", endedEarly: true, endedAt: at(40) });
    expect(timeline.active?.id).toBe("s2");
    expect(timeline.active?.startedAt).toEqual(at(40));
    expect(timeline.active?.deadline).toEqual(at(240));
  });

  it("keeps the clock running while the participant is away", () => {
    // Away for 7 minutes: sections 1 and 2 have both expired.
    const timeline = buildTimeline(START, sections(), at(420));

    expect(timeline.sections.map((s) => s.state)).toEqual(["done", "done", "active"]);
    expect(timeline.active?.deadline).toEqual(at(600));
  });

  it("is finished once the last section ends", () => {
    const timeline = buildTimeline(START, sections(), at(600));

    expect(timeline.active).toBeNull();
    expect(timeline.finished).toBe(true);
  });

  it("uses stored times over the subtest's current duration", () => {
    // Section 1 opened with a 100 s deadline. Changing the duration afterwards must not move it.
    const stored = sections([{ startedAt: at(0), deadline: at(100), durationSeconds: 999 }]);
    const timeline = buildTimeline(START, stored, at(50));

    expect(timeline.active?.deadline).toEqual(at(100));
  });
});

describe("acceptsAnswers", () => {
  it("accepts answers for the active section", () => {
    const timeline = buildTimeline(START, sections(), at(10));
    expect(acceptsAnswers(timeline.sections[0], at(10))).toBe(true);
  });

  it("rejects answers for a section that hasn't started", () => {
    const timeline = buildTimeline(START, sections(), at(10));
    expect(acceptsAnswers(timeline.sections[1], at(10))).toBe(false);
  });

  it("accepts late answers within the grace period after the deadline", () => {
    const justAfter = new Date(at(100).getTime() + ANSWER_GRACE_MS - 1);
    const timeline = buildTimeline(START, sections(), justAfter);

    expect(timeline.sections[0].state).toBe("done");
    expect(acceptsAnswers(timeline.sections[0], justAfter)).toBe(true);
  });

  it("rejects answers after the grace period", () => {
    const tooLate = new Date(at(100).getTime() + ANSWER_GRACE_MS + 1);
    const timeline = buildTimeline(START, sections(), tooLate);
    expect(acceptsAnswers(timeline.sections[0], tooLate)).toBe(false);
  });

  it("gives no grace period to a section submitted early", () => {
    const timeline = buildTimeline(START, sections([{ submittedAt: at(40) }]), at(41));
    expect(acceptsAnswers(timeline.sections[0], at(41))).toBe(false);
  });
});
