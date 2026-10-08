// Parsing and validation for the admin content forms. Pure (FormData in, plain data or an error out),
// so the rules are unit tested and every admin Server Action validates the same way.
import type { AccessTier, ExamType } from "@/generated/prisma/client";

export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export const MAX_SUBTEST_SECONDS = 4 * 60 * 60;

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const EXAM_TYPES: readonly ExamType[] = ["UTBK", "TKA"];
const ACCESS_TIERS: readonly AccessTier[] = ["FREE", "PREMIUM"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

// A FormData value is a string or a File. Anything that isn't a string counts as empty.
function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

// "12" -> 12. Decimals, signs and other text -> null.
function wholeNumber(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

// "Tryout UTBK #3: Penalaran" -> "tryout-utbk-3-penalaran"
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop the accents NFKD split off, so "é" becomes "e"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export type TryoutInput = {
  title: string;
  slug: string;
  description: string | null;
  examType: ExamType;
  accessTier: AccessTier;
};

export function parseTryoutForm(formData: FormData): ParseResult<TryoutInput> {
  const title = text(formData, "title");
  const slug = text(formData, "slug") || slugify(title);
  const description = text(formData, "description");
  const examType = text(formData, "examType");
  const accessTier = text(formData, "accessTier");

  if (!title) return fail("Judul wajib diisi.");
  if (title.length > 120) return fail("Judul maksimal 120 karakter.");
  if (slug.length > 60 || !SLUG_PATTERN.test(slug)) {
    return fail("Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (maksimal 60 karakter).");
  }
  if (description.length > 500) return fail("Deskripsi maksimal 500 karakter.");
  if (!isOneOf(examType, EXAM_TYPES)) return fail("Jenis ujian tidak valid.");
  if (!isOneOf(accessTier, ACCESS_TIERS)) return fail("Akses tidak valid.");

  return { ok: true, data: { title, slug, description: description || null, examType, accessTier } };
}

export type SubtestInput = { code: string; name: string; durationSeconds: number };

export function parseSubtestForm(formData: FormData): ParseResult<SubtestInput> {
  const code = text(formData, "code").toUpperCase();
  const name = text(formData, "name");
  const minutes = wholeNumber(text(formData, "minutes") || "0");
  const seconds = wholeNumber(text(formData, "seconds") || "0");

  if (!/^[A-Z0-9]{1,10}$/.test(code)) return fail("Kode wajib diisi: 1–10 huruf atau angka, misalnya PU.");
  if (!name) return fail("Nama subtes wajib diisi.");
  if (name.length > 100) return fail("Nama subtes maksimal 100 karakter.");
  if (minutes === null || seconds === null || seconds > 59) return fail("Durasi tidak valid.");

  const durationSeconds = minutes * 60 + seconds;
  if (durationSeconds < 10 || durationSeconds > MAX_SUBTEST_SECONDS) {
    return fail("Durasi harus antara 10 detik dan 4 jam.");
  }
  return { ok: true, data: { code, name, durationSeconds } };
}

export type QuestionInput = {
  stimulus: string | null;
  stem: string;
  explanation: string | null;
  weight: number;
  options: { label: OptionLabel; text: string }[];
  correctLabel: OptionLabel;
};

export function parseQuestionForm(formData: FormData): ParseResult<QuestionInput> {
  const stimulus = text(formData, "stimulus");
  const stem = text(formData, "stem");
  const explanation = text(formData, "explanation");
  const weight = wholeNumber(text(formData, "weight") || "1");
  // The form uses one radio group named "correct", so a question can never have two answer keys.
  const correctLabel = text(formData, "correct");
  const options = OPTION_LABELS.map((label) => ({ label, text: text(formData, `option${label}`) }));

  if (!stem) return fail("Pertanyaan wajib diisi.");
  if (stimulus.length > 10000) return fail("Stimulus maksimal 10.000 karakter.");
  if (stem.length > 5000) return fail("Pertanyaan maksimal 5.000 karakter.");
  if (explanation.length > 5000) return fail("Pembahasan maksimal 5.000 karakter.");
  const empty = options.find((option) => !option.text);
  if (empty) return fail(`Opsi ${empty.label} wajib diisi.`);
  if (options.some((option) => option.text.length > 1000)) return fail("Teks opsi maksimal 1.000 karakter.");
  if (!isOneOf(correctLabel, OPTION_LABELS)) return fail("Pilih satu jawaban yang benar.");
  if (weight === null || weight < 1 || weight > 10) return fail("Bobot harus bilangan bulat 1–10.");

  return {
    ok: true,
    data: { stimulus: stimulus || null, stem, explanation: explanation || null, weight, options, correctLabel },
  };
}

// What stops a tryout from being published. Empty means it's ready.
export function publishProblems(subtests: { code: string; questionCount: number }[]): string[] {
  if (subtests.length === 0) return ["Tambahkan minimal satu subtes."];
  return subtests
    .filter((subtest) => subtest.questionCount === 0)
    .map((subtest) => `Subtes ${subtest.code} belum punya soal.`);
}

// The submitted text fields, echoed back after a failed save so the form keeps what the admin typed.
// Next.js adds its own "$ACTION_..." fields to the FormData; those are left out.
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}
