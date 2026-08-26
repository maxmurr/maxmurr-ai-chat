import type { ReactNode } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

type AuthenticationFieldProps = {
  children: ReactNode
  className?: string
  description?: ReactNode
  descriptionId?: string
  error?: string
  errorId: string
  htmlFor: string
  invalid: boolean
  label: string
}

/** Renders shared label, description, and error chrome for auth controls. */
export function AuthenticationField({
  children,
  className,
  description,
  descriptionId,
  error,
  errorId,
  htmlFor,
  invalid,
  label,
}: AuthenticationFieldProps) {
  return (
    <Field className={cn(className)} data-invalid={invalid || undefined}>
      <FieldLabel className="leading-none" htmlFor={htmlFor}>
        {label}
      </FieldLabel>
      {children}
      {description !== undefined && (
        <FieldDescription
          className="text-sm sm:text-xs"
          id={descriptionId}
        >
          {description}
        </FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  )
}
