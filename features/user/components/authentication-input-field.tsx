import type { ComponentProps, ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthenticationInputFieldProps = Omit<
  ComponentProps<typeof Input>,
  "aria-describedby" | "aria-invalid" | "className" | "id"
> & {
  className?: string;
  description?: ReactNode;
  descriptionId?: string;
  error?: string;
  errorId: string;
  id: string;
  inputClassName?: string;
  invalid: boolean;
  label: string;
};

/** Renders one labeled authentication Input with description and error state. */
export function AuthenticationInputField({
  className,
  description,
  descriptionId,
  error,
  errorId,
  id,
  inputClassName,
  invalid,
  label,
  ...inputProps
}: AuthenticationInputFieldProps) {
  const describedBy = [
    description !== undefined ? descriptionId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Field className={cn(className)} data-invalid={invalid || undefined}>
      <FieldLabel className="leading-none" htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        {...inputProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={invalid}
        className={cn("h-11", inputClassName)}
        id={id}
      />
      {description !== undefined && (
        <FieldDescription className="text-sm sm:text-xs" id={descriptionId}>
          {description}
        </FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
