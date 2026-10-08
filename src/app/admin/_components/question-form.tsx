"use client";

import { useActionState } from "react";

import { FormField, TextAreaField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { AdminFormState } from "@/lib/admin-actions";
import { OPTION_LABELS, type OptionLabel } from "@/lib/admin-forms";

import { FormStatus } from "./form-status";

export type QuestionFormValues = {
  stimulus: string;
  stem: string;
  explanation: string;
  weight: number;
  options: Record<OptionLabel, string>;
  correctLabel: OptionLabel | "";
};

const EMPTY: QuestionFormValues = {
  stimulus: "",
  stem: "",
  explanation: "",
  weight: 1,
  options: { A: "", B: "", C: "", D: "", E: "" },
  correctLabel: "",
};

type QuestionFormProps = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initial?: QuestionFormValues;
  // Answer key and weight can't change once the tryout has attempts. Wording can.
  scoringLocked?: boolean;
  submitLabel: string;
};

export function QuestionForm({ action, initial = EMPTY, scoringLocked = false, submitLabel }: QuestionFormProps) {
  const [state, formAction] = useActionState(action, {});
  const values = state.values;
  const correct = values?.correct ?? initial.correctLabel;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextAreaField
        label="Stimulus (opsional)"
        name="stimulus"
        rows={4}
        hint="Bacaan, tabel, atau data yang ditampilkan di atas pertanyaan."
        defaultValue={values?.stimulus ?? initial.stimulus}
      />
      <TextAreaField label="Pertanyaan" name="stem" rows={3} required defaultValue={values?.stem ?? initial.stem} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-700">Opsi jawaban · pilih satu yang benar</legend>
        {OPTION_LABELS.map((label) => (
          <div key={label} className="flex items-center gap-3">
            {/* One radio group named "correct": the browser itself allows only one answer key. */}
            <label className="flex w-12 shrink-0 items-center gap-1.5 text-sm font-semibold">
              <input
                type="radio"
                name="correct"
                value={label}
                required
                disabled={scoringLocked}
                defaultChecked={correct === label}
                aria-label={`Opsi ${label} benar`}
                className="accent-emerald-600"
              />
              {label}
            </label>
            <input
              name={`option${label}`}
              required
              maxLength={1000}
              aria-label={`Teks opsi ${label}`}
              defaultValue={values?.[`option${label}`] ?? initial.options[label]}
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}
      </fieldset>

      <div className="sm:max-w-40">
        <FormField
          label="Bobot"
          name="weight"
          type="number"
          min={1}
          max={10}
          required
          disabled={scoringLocked}
          hint="Nilai soal ini relatif terhadap soal lain di subtes yang sama."
          defaultValue={values?.weight ?? String(initial.weight)}
        />
      </div>
      {scoringLocked && (
        <>
          {/* Disabled inputs aren't submitted; the server still checks these against the database. */}
          <input type="hidden" name="correct" value={initial.correctLabel} />
          <input type="hidden" name="weight" value={initial.weight} />
          <p className="-mt-3 text-xs text-zinc-500">
            Kunci jawaban dan bobot terkunci karena tryout ini sudah dikerjakan peserta.
          </p>
        </>
      )}

      <TextAreaField
        label="Pembahasan (opsional)"
        name="explanation"
        rows={3}
        hint="Hanya ditampilkan ke peserta setelah tryout selesai."
        defaultValue={values?.explanation ?? initial.explanation}
      />

      <FormStatus state={state} />
      <div>
        <SubmitButton pendingText="Menyimpan...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
