"use client";

import { useId, useMemo, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface EmailFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  inputClassName?: string;
}

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  showStrength?: boolean;
  inputClassName?: string;
}

export type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  symbol: boolean;
};

const PASSWORD_REQUIREMENTS: Array<{
  id: keyof PasswordChecks;
  label: string;
  test: (password: string) => boolean;
}> = [
  {
    id: "length",
    label: "Minimal 8 karakter",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Ada huruf besar",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Ada angka",
    test: (password: string) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "Ada simbol",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

export function evaluatePassword(password: string): PasswordChecks {
  return PASSWORD_REQUIREMENTS.reduce<PasswordChecks>(
    (acc, requirement) => {
      acc[requirement.id] = requirement.test(password);
      return acc;
    },
    {
      length: false,
      uppercase: false,
      number: false,
      symbol: false,
    }
  );
}

export function isPasswordValid(password: string) {
  const checks = evaluatePassword(password);
  return PASSWORD_REQUIREMENTS.every((requirement) => checks[requirement.id]);
}

export function EmailField({
  id,
  label = "Email",
  error,
  className,
  inputClassName,
  ...props
}: EmailFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={inputId}
        type="email"
        autoComplete="email"
        className={cn(inputClassName)}
        {...props}
      />
      {error ? (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <Circle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  id,
  label = "Password",
  error,
  showStrength = true,
  className,
  inputClassName,
  value = "",
  onChange,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [show, setShow] = useState(false);
  const stringValue = typeof value === "string" ? value : String(value ?? "");
  const checks = useMemo(() => evaluatePassword(stringValue), [stringValue]);

  const toggle = () => setShow((prev) => !prev);

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={inputId}
          type={show ? "text" : "password"}
          autoComplete={props.autoComplete ?? "new-password"}
          value={value}
          onChange={onChange}
          className={cn("pr-12", inputClassName)}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition hover:text-foreground"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <Circle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {showStrength ? <PasswordChecklist checks={checks} /> : null}
    </div>
  );
}

export function PasswordChecklist({ checks }: { checks: PasswordChecks }) {
  return (
    <ul className="space-y-1 rounded-xl border border-border/60 bg-background/30 p-3 text-xs">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const satisfied = checks[requirement.id];
        const Icon = satisfied ? CheckCircle2 : Circle;
        return (
          <li
            key={requirement.id}
            className={cn("flex items-center gap-2", satisfied ? "text-emerald-400" : "text-muted-foreground")}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{requirement.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export { PASSWORD_REQUIREMENTS };
