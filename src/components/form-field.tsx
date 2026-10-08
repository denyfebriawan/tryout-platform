import type { ComponentProps } from "react";

type FormFieldProps = ComponentProps<"input"> & { label: string; name: string };

export function FormField({ label, name, ...inputProps }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        name={name}
        className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        {...inputProps}
      />
    </label>
  );
}
