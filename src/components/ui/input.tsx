import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-[96px] leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "h-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("block text-sm font-medium text-foreground", className)} {...props}>
      {children}
      {required && (
        <span className="ml-1 text-danger" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckboxGroup({
  name,
  options,
  value,
  onChange,
  columns = 2,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange?: (v: string[]) => void;
  columns?: number;
}) {
  return (
    <div className={cn("grid gap-2", columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
      {options.map((o) => {
        const checked = value.includes(o.value);
        return (
          <label key={o.value} className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-slate-50">
            <input
              type="checkbox"
              name={name}
              value={o.value}
              checked={checked}
              onChange={(e) => {
                if (!onChange) return;
                onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value));
              }}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  inline,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string | null | undefined;
  onChange?: (v: string) => void;
  inline?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", inline ? "flex-wrap" : "flex-col")}>
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
            value === o.value ? "border-primary bg-accent" : "border-border bg-surface hover:bg-slate-50",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange?.(o.value)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
