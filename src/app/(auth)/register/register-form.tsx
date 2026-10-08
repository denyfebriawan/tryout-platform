"use client";

import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { signUp } from "@/lib/auth-actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField label="Nama lengkap" name="name" autoComplete="name" required defaultValue={state.values?.name} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required />

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {isPending ? "Memproses..." : "Daftar"}
      </button>
    </form>
  );
}
