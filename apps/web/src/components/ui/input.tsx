"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-xl border bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] duration-150 outline-none hover:border-line-strong focus:border-ink focus:ring-4 focus:ring-ink/5 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted";

const controlError = "border-danger hover:border-danger focus:border-danger focus:ring-danger/10";

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink-soft">
        {label}
        {optional && <span className="text-xs font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-[0.8125rem] text-danger" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = FieldProps & Omit<ComponentProps<"input">, "className">;

export function Input({ label, error, hint, optional, className, id: idProp, ...props }: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <input
        id={id}
        className={cn(control, "h-12", error ? controlError : "border-line")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

type SelectProps = FieldProps &
  Omit<ComponentProps<"select">, "className"> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  };

export function Select({ label, error, hint, optional, className, id: idProp, options, placeholder, ...props }: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <select
          id={id}
          className={cn(control, "h-12 appearance-none pr-10", error ? controlError : "border-line")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      </div>
    </FieldShell>
  );
}

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, className, id: idProp, ...props }: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <label htmlFor={id} className={cn("group flex cursor-pointer items-start gap-3 text-sm", className)}>
      <span className="relative mt-0.5 flex size-[1.125rem] shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer size-full cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors checked:border-brand checked:bg-brand group-hover:border-ink checked:group-hover:border-brand-hover checked:group-hover:bg-brand-hover"
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={3.5}
          aria-hidden
        />
      </span>
      <span className="flex flex-col">
        <span className="text-ink-soft">{label}</span>
        {description && <span className="text-[0.8125rem] text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}
