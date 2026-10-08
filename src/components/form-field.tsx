import type { ComponentProps, ReactNode } from "react";

const controlClass =
  "rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-100 disabled:text-zinc-500";

function FieldLabel({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

type FormFieldProps = ComponentProps<"input"> & { label: string; name: string; hint?: string };

export function FormField({ label, name, hint, ...inputProps }: FormFieldProps) {
  return (
    <FieldLabel label={label} hint={hint}>
      <input name={name} className={controlClass} {...inputProps} />
    </FieldLabel>
  );
}

type TextAreaFieldProps = ComponentProps<"textarea"> & { label: string; name: string; hint?: string };

export function TextAreaField({ label, name, hint, ...textareaProps }: TextAreaFieldProps) {
  return (
    <FieldLabel label={label} hint={hint}>
      <textarea name={name} rows={3} className={controlClass} {...textareaProps} />
    </FieldLabel>
  );
}

type SelectFieldProps = ComponentProps<"select"> & {
  label: string;
  name: string;
  hint?: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, name, hint, options, ...selectProps }: SelectFieldProps) {
  return (
    <FieldLabel label={label} hint={hint}>
      <select name={name} className={`${controlClass} bg-white`} {...selectProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}
