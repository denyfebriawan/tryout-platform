import { describe, expect, it } from "vitest";

import { formValues, parseQuestionForm, parseSubtestForm, parseTryoutForm, publishProblems, slugify } from "./admin-forms";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const validQuestion = {
  stem: "Berapakah 2 + 3?",
  optionA: "4",
  optionB: "5",
  optionC: "6",
  optionD: "7",
  optionE: "8",
  correct: "B",
};

describe("slugify", () => {
  it("lowercases, strips accents and joins words with dashes", () => {
    expect(slugify("  Tryout UTBK #3: Penalaran Café ")).toBe("tryout-utbk-3-penalaran-cafe");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = slugify(`${"a".repeat(59)} bcd`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("parseTryoutForm", () => {
  it("derives the slug from the title when it's left empty", () => {
    const result = parseTryoutForm(form({ title: "Tryout TKA 2", slug: "", examType: "TKA", accessTier: "FREE" }));
    expect(result).toEqual({
      ok: true,
      data: { title: "Tryout TKA 2", slug: "tryout-tka-2", description: null, examType: "TKA", accessTier: "FREE" },
    });
  });

  it("rejects a malformed slug and unknown enum values", () => {
    const base = { title: "T", examType: "UTBK", accessTier: "PREMIUM" };
    expect(parseTryoutForm(form({ ...base, slug: "Bad Slug" })).ok).toBe(false);
    expect(parseTryoutForm(form({ ...base, examType: "SBMPTN" })).ok).toBe(false);
    expect(parseTryoutForm(form({ ...base, accessTier: "GOLD" })).ok).toBe(false);
  });
});

describe("parseSubtestForm", () => {
  it("uppercases the code and combines minutes and seconds", () => {
    const result = parseSubtestForm(form({ code: "pu", name: "Penalaran Umum", minutes: "7", seconds: "5" }));
    expect(result).toEqual({ ok: true, data: { code: "PU", name: "Penalaran Umum", durationSeconds: 425 } });
  });

  it("rejects invalid durations", () => {
    const base = { code: "PU", name: "Penalaran Umum" };
    expect(parseSubtestForm(form({ ...base, minutes: "1", seconds: "60" })).ok).toBe(false);
    expect(parseSubtestForm(form({ ...base, minutes: "1.5", seconds: "0" })).ok).toBe(false);
    expect(parseSubtestForm(form({ ...base, minutes: "0", seconds: "5" })).ok).toBe(false);
    expect(parseSubtestForm(form({ ...base, minutes: "241", seconds: "0" })).ok).toBe(false);
  });
});

describe("parseQuestionForm", () => {
  it("accepts a complete question and defaults the weight to 1", () => {
    const result = parseQuestionForm(form(validQuestion));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.correctLabel).toBe("B");
    expect(result.data.weight).toBe(1);
    expect(result.data.stimulus).toBeNull();
    expect(result.data.options.map((option) => option.label)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("requires every option, an answer key and a sane weight", () => {
    expect(parseQuestionForm(form({ ...validQuestion, optionD: " " }))).toEqual({
      ok: false,
      error: "Opsi D wajib diisi.",
    });
    expect(parseQuestionForm(form({ ...validQuestion, correct: "" })).ok).toBe(false);
    expect(parseQuestionForm(form({ ...validQuestion, correct: "F" })).ok).toBe(false);
    expect(parseQuestionForm(form({ ...validQuestion, weight: "0" })).ok).toBe(false);
  });
});

describe("publishProblems", () => {
  it("needs at least one subtest, each with questions", () => {
    expect(publishProblems([])).toHaveLength(1);
    expect(publishProblems([{ code: "PU", questionCount: 5 }, { code: "PK", questionCount: 0 }])).toEqual([
      "Subtes PK belum punya soal.",
    ]);
    expect(publishProblems([{ code: "PU", questionCount: 5 }])).toEqual([]);
  });
});

describe("formValues", () => {
  it("keeps text fields and drops Next.js action fields", () => {
    expect(formValues(form({ title: "A", $ACTION_ID_abc: "" }))).toEqual({ title: "A" });
  });
});
