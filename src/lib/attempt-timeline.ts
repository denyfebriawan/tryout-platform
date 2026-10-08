// Pure timer logic for an attempt: given what's stored and the current time, work out which
// section is open. No database access here, so it's easy to unit test.
//
// Sections run back to back, like the real UTBK: section 1 starts when the attempt starts, and each
// later section starts the moment the previous one ends (submitted early or out of time). The clock
// keeps running while the participant is away, so leaving the page doesn't pause the exam.

// Answers that arrive this long after a deadline are still accepted, to absorb network latency.
export const ANSWER_GRACE_MS = 10_000;

export type SectionTiming = {
  id: string;
  durationSeconds: number;
  // Stored values. null means the server hasn't written them yet, so they're derived instead.
  startedAt: Date | null;
  deadline: Date | null;
  submittedAt: Date | null;
};

export type SectionState = "done" | "active" | "upcoming";

export type TimelineSection = {
  id: string;
  startedAt: Date;
  deadline: Date;
  // When the section closes: the early submit time, or the deadline.
  endedAt: Date;
  endedEarly: boolean;
  state: SectionState;
};

export type Timeline = {
  sections: TimelineSection[];
  active: TimelineSection | null;
  // Every section has ended, so the attempt is over even if it hasn't been marked submitted yet.
  finished: boolean;
};

export function buildTimeline(attemptStartedAt: Date, sections: SectionTiming[], now: Date): Timeline {
  let previousEnd = attemptStartedAt;
  let active: TimelineSection | null = null;

  const timeline = sections.map((section): TimelineSection => {
    // Stored times win: once a section opens, its deadline is fixed even if an admin later
    // changes the subtest's duration.
    const startedAt = section.startedAt ?? previousEnd;
    const deadline = section.deadline ?? new Date(startedAt.getTime() + section.durationSeconds * 1000);
    const endedEarly = section.submittedAt !== null && section.submittedAt.getTime() < deadline.getTime();
    const endedAt = endedEarly ? section.submittedAt! : deadline;
    previousEnd = endedAt;

    let state: SectionState;
    if (endedAt.getTime() <= now.getTime()) state = "done";
    else if (active === null) state = "active";
    else state = "upcoming";

    const result = { id: section.id, startedAt, deadline, endedAt, endedEarly, state };
    if (state === "active") active = result;
    return result;
  });

  return { sections: timeline, active, finished: active === null };
}

// Whether the server should still accept an answer for a question in this section.
// A section closed by its deadline gets the grace period; one the participant submitted early doesn't.
export function acceptsAnswers(section: TimelineSection, now: Date): boolean {
  if (section.state === "active") return true;
  if (section.state === "upcoming" || section.endedEarly) return false;
  return now.getTime() <= section.deadline.getTime() + ANSWER_GRACE_MS;
}
