"use client";

import { type ReactNode, useActionState } from "react";

import type { AdminFormState } from "@/lib/admin-actions";

const VARIANTS = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

type ActionButtonProps = {
  // A Server Action with its arguments already bound by the page, e.g. deleteTryout.bind(null, id).
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  children: ReactNode;
  pendingText?: string;
  confirmText?: string;
  variant?: keyof typeof VARIANTS;
  title?: string;
};

// A one-button form for actions without inputs (publish, delete, move), showing the action's error.
export function ActionButton({ action, children, pendingText, confirmText, variant = "secondary", title }: ActionButtonProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      // Calling preventDefault() in onSubmit stops React from running the action.
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <button
        type="submit"
        disabled={isPending}
        title={title}
        className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${VARIANTS[variant]}`}
      >
        {isPending && pendingText ? pendingText : children}
      </button>
      {state.error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
