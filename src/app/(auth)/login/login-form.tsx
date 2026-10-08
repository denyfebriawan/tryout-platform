"use client";

import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { signIn } from "@/lib/auth-actions";

export function LoginForm() {
  // useActionState wires the form to the Server Action: `state` is whatever the action returned
  // last time (e.g. an error message) and `isPending` is true while the request is in flight.
  const [state, formAction, isPending] = useActionState(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required />

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
        {isPending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
