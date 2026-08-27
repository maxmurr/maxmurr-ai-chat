import type { ReactNode } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { MailIcon } from "lucide-react"
import Link from "next/link"

import {
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

type AuthenticationFormHeaderProps = {
  className?: string
  description: ReactNode
  isVerificationStep: boolean
  title: ReactNode
}

/** Renders authentication title, description, and verification icon. */
export function AuthenticationFormHeader({
  className,
  description,
  isVerificationStep,
  title,
}: AuthenticationFormHeaderProps) {
  return (
    <CardHeader
      className={cn("justify-items-center gap-2 text-center", className)}
    >
      {isVerificationStep && (
        <div
          aria-hidden="true"
          className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-foreground"
        >
          <MailIcon className="size-5" />
        </div>
      )}
      <h1 className="text-balance font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <CardDescription className="text-balance">
        {description}
      </CardDescription>
    </CardHeader>
  )
}

type AuthenticationOtpFieldProps = {
  className?: string
  disabled: boolean
  error?: string
  invalid: boolean
  name: string
  onBlur: () => void
  onChange: (value: string) => void
  onComplete: () => void
  value: string
}

/** Renders accessible six-digit authentication verification control. */
export function AuthenticationOtpField({
  className,
  disabled,
  error,
  invalid,
  name,
  onBlur,
  onChange,
  onComplete,
  value,
}: AuthenticationOtpFieldProps) {
  const errorId = "otp-error"

  return (
    <Field
      className={cn("items-center", className)}
      data-invalid={invalid || undefined}
    >
      <FieldLabel className="sr-only" htmlFor="verification-code">
        One-time password
      </FieldLabel>
      <InputOTP
        aria-describedby={error ? errorId : undefined}
        aria-invalid={invalid}
        autoComplete="one-time-code"
        autoFocus
        containerClassName="justify-center"
        disabled={disabled}
        id="verification-code"
        maxLength={6}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        required
        value={value}
      >
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              aria-invalid={invalid}
              className="h-12 w-11 text-lg"
              index={index}
              key={index}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <FieldError className="text-center" id={errorId}>
        {error}
      </FieldError>
      <span aria-live="polite" className="sr-only">
        {disabled ? "Verifying one-time password…" : ""}
      </span>
    </Field>
  )
}

type AuthenticationAlternateLinkProps = {
  callbackPath: string
  className?: string
  isSignUp: boolean
}

/** Renders link between sign-in and sign-up authentication modes. */
export function AuthenticationAlternateLink({
  callbackPath,
  className,
  isSignUp,
}: AuthenticationAlternateLinkProps) {
  const alternatePath = isSignUp ? "/sign-in" : "/sign-up"
  const alternateHref =
    callbackPath === "/chat"
      ? alternatePath
      : `${alternatePath}?callbackURL=${encodeURIComponent(callbackPath)}`

  return (
    <CardFooter
      className={cn(
        "flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
    >
      <span>
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
      </span>
      <Link
        className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        href={alternateHref}
      >
        {isSignUp ? "Sign In" : "Sign Up"}
      </Link>
    </CardFooter>
  )
}
