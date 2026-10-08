"use client";

import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { AdminFormState } from "@/lib/admin-actions";

import { FormStatus } from "./form-status";

export type SubtestFormValues = { code: string; name: string; durationSeconds: number };

type SubtestFormProps = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initial?: SubtestFormValues;
  durationLocked?: boolean;
  submitLabel: string;
};

export function SubtestForm({ action, initial, durationLocked = false, submitLabel }: SubtestFormProps) {
  const [state, formAction] = useActionState(action, {});
  const minutes = initial ? String(Math.floor(initial.durationSeconds / 60)) : "";
  const seconds = initial ? String(initial.durationSeconds % 60) : "0";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <FormField
          label="Kode"
          name="code"
          required
          maxLength={10}
          placeholder="PU"
          defaultValue={state.values?.code ?? initial?.code}
        />
        <FormField
          label="Nama subtes"
          name="name"
          required
          maxLength={100}
          placeholder="Penalaran Umum"
          defaultValue={state.values?.name ?? initial?.name}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
        <FormField
          label="Menit"
          name="minutes"
          type="number"
          min={0}
          max={240}
          required
          disabled={durationLocked}
          defaultValue={state.values?.minutes ?? minutes}
        />
        <FormField
          label="Detik"
          name="seconds"
          type="number"
          min={0}
          max={59}
          disabled={durationLocked}
          defaultValue={state.values?.seconds ?? seconds}
        />
      </div>
      {durationLocked && (
        <>
          <input type="hidden" name="minutes" value={minutes} />
          <input type="hidden" name="seconds" value={seconds} />
          <p className="-mt-2 text-xs text-zinc-500">Durasi terkunci: timer peserta yang sedang mengerjakan bergantung padanya.</p>
        </>
      )}
      <FormStatus state={state} />
      <div>
        <SubmitButton pendingText="Menyimpan...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
