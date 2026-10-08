import type { AdminFormState } from "@/lib/admin-actions";

// The result of the last save: an error, or a confirmation.
export function FormStatus({ state }: { state: AdminFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.message}
      </p>
    );
  }
  return null;
}
