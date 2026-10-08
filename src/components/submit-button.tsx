"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// A submit button that disables itself while its parent <form> is posting to a Server Action.
// useFormStatus reads the status of the nearest parent form, so this must be rendered inside one.
export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}
