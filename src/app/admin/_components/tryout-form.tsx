"use client";

import { useActionState } from "react";

import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { AdminFormState } from "@/lib/admin-actions";

import { FormStatus } from "./form-status";

export type TryoutFormValues = {
  title: string;
  slug: string;
  description: string;
  examType: string;
  accessTier: string;
};

const EMPTY: TryoutFormValues = { title: "", slug: "", description: "", examType: "UTBK", accessTier: "PREMIUM" };

type TryoutFormProps = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initial?: TryoutFormValues;
  examTypeLocked?: boolean;
  submitLabel: string;
};

// Used by both "new tryout" and "edit tryout"; the page passes the matching Server Action.
export function TryoutForm({ action, initial = EMPTY, examTypeLocked = false, submitLabel }: TryoutFormProps) {
  const [state, formAction] = useActionState(action, {});
  // After a failed save, show what the admin typed rather than the stored values.
  const value = (name: keyof TryoutFormValues) => state.values?.[name] ?? initial[name];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField label="Judul" name="title" required maxLength={120} defaultValue={value("title")} />
      <FormField
        label="Slug"
        name="slug"
        maxLength={60}
        placeholder="otomatis dari judul"
        hint="Dipakai di URL, misalnya /tryouts/tryout-utbk-1. Huruf kecil, angka, dan tanda hubung."
        defaultValue={value("slug")}
      />
      <TextAreaField label="Deskripsi" name="description" maxLength={500} defaultValue={value("description")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {/* React resets the form after each save, and a <select> resets to the defaultValue it had when
            it was first mounted: React doesn't update it on re-render (inputs and textareas it does).
            Keying the select on its default remounts it whenever the default changes. */}
        <SelectField
          key={`examType-${value("examType")}`}
          label="Jenis ujian"
          name="examType"
          defaultValue={value("examType")}
          disabled={examTypeLocked}
          hint={examTypeLocked ? "Terkunci: menentukan skala skor yang sudah tersimpan." : "UTBK skor 0–1000, TKA skor 0–100."}
          options={[
            { value: "UTBK", label: "UTBK-SNBT" },
            { value: "TKA", label: "TKA" },
          ]}
        />
        {/* Disabled fields aren't submitted, so the current value travels in a hidden field.
            The server still compares it with the database and refuses a change. */}
        {examTypeLocked && <input type="hidden" name="examType" value={initial.examType} />}
        <SelectField
          key={`accessTier-${value("accessTier")}`}
          label="Akses"
          name="accessTier"
          defaultValue={value("accessTier")}
          options={[
            { value: "FREE", label: "Gratis" },
            { value: "PREMIUM", label: "Premium" },
          ]}
        />
      </div>
      <FormStatus state={state} />
      <div>
        <SubmitButton pendingText="Menyimpan...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
