import type { AccessTier, ExamType } from "../../src/generated/prisma/client";

export type OptionLabel = "A" | "B" | "C" | "D" | "E";

export type SeedQuestion = {
  stimulus?: string;
  stem: string;
  options: [string, string, string, string, string];
  answer: OptionLabel;
  explanation: string;
};

export type SubtestSpec = {
  code: string;
  name: string;
  // The real exam's question count and time. The demo has fewer questions, so the seed scales the
  // time to keep the same pace per question (see demoDurationSeconds in index.ts).
  official: { questions: number; minutes: number };
};

export type SeedSubtest = SubtestSpec & { questions: SeedQuestion[] };

export type SeedTryout = {
  slug: string;
  title: string;
  description: string;
  examType: ExamType;
  accessTier: AccessTier;
  subtests: SeedSubtest[];
};

// UTBK-SNBT, as published on the SNPMB portal for 2026 (same as 2025): 160 questions, 195 minutes.
export const UTBK = {
  PU: { code: "PU", name: "Penalaran Umum", official: { questions: 30, minutes: 30 } },
  PPU: { code: "PPU", name: "Pengetahuan dan Pemahaman Umum", official: { questions: 20, minutes: 15 } },
  PBM: { code: "PBM", name: "Pemahaman Bacaan dan Menulis", official: { questions: 20, minutes: 25 } },
  PK: { code: "PK", name: "Pengetahuan Kuantitatif", official: { questions: 20, minutes: 20 } },
  LBI: { code: "LBI", name: "Literasi dalam Bahasa Indonesia", official: { questions: 30, minutes: 42.5 } },
  LBE: { code: "LBE", name: "Literasi dalam Bahasa Inggris", official: { questions: 20, minutes: 20 } },
  PM: { code: "PM", name: "Penalaran Matematika", official: { questions: 20, minutes: 42.5 } },
} satisfies Record<string, SubtestSpec>;

// TKA SMA, the three compulsory subjects. The elective subjects are out of scope for the demo.
export const TKA = {
  BIN: { code: "BIN", name: "Bahasa Indonesia", official: { questions: 30, minutes: 75 } },
  MAT: { code: "MAT", name: "Matematika", official: { questions: 25, minutes: 75 } },
  BIG: { code: "BIG", name: "Bahasa Inggris", official: { questions: 30, minutes: 75 } },
} satisfies Record<string, SubtestSpec>;
