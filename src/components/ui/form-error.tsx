import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Form error message component — AGENTS.md §4.5 form guidelines.
 *
 * Displays inline validation errors with consistent styling and icon.
 * Pairs with Input component's `aria-invalid` state.
 *
 * Usage:
 *   <Input aria-invalid={!!error} />
 *   <FormError>{error}</FormError>
 */

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormError({ children, className, ...props }: FormErrorProps) {
  if (!children) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs text-destructive mt-1.5",
        className
      )}
      role="alert"
      {...props}
    >
      <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Form field wrapper with label and error support.
 *
 * Usage:
 *   <FormField label="Email" error={errors.email}>
 *     <Input type="email" aria-invalid={!!errors.email} />
 *   </FormField>
 */

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      <FormError>{error}</FormError>
    </div>
  );
}

/**
 * Form-level error message (e.g., API errors, general validation failures).
 *
 * Usage:
 *   <FormAlert>Failed to save transaction. Please try again.</FormAlert>
 */

interface FormAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "error" | "warning" | "info";
}

export function FormAlert({
  children,
  variant = "error",
  className,
  ...props
}: FormAlertProps) {
  const styles = {
    error: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    info: "bg-accent/10 text-accent border-accent/30",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        styles[variant],
        className
      )}
      role="alert"
      {...props}
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Made with Bob
