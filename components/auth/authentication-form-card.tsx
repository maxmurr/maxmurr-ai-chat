"use client"

import { useForm } from "@tanstack/react-form"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { MailIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { AuthenticationField } from "@/components/auth/authentication-field"
import { AuthenticationGoogleButton } from "@/components/auth/authentication-google-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type AuthenticationMode = "sign-in" | "sign-up"

type AuthenticationFormValues = {
  email: string
  otp: string
  username: string
}

type AuthenticationVerificationRequest = {
  email: string
  username: string
}

type AuthenticationFormCardProps = {
  callbackPath?: string
  className?: string
  emailOtpEnabled: boolean
  googleEnabled: boolean
  initialErrorMessage?: string
  mode: AuthenticationMode
}

const AUTHENTICATION_USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/
const AUTHENTICATION_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AUTHENTICATION_OTP_PATTERN = /^\d{6}$/
const defaultAuthenticationFormValues: AuthenticationFormValues = {
  email: "",
  otp: "",
  username: "",
}

/** Validates account username syntax during email OTP registration. */
export function validateAuthenticationUsername(username: string) {
  const normalizedUsername = username.trim()

  if (!normalizedUsername) {
    return "Enter your username."
  }

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 31 ||
    !AUTHENTICATION_USERNAME_PATTERN.test(normalizedUsername)
  ) {
    return "Use 3–31 letters, numbers, underscores, or periods."
  }

  return undefined
}

/** Validates email syntax before requesting an authentication code. */
export function validateAuthenticationEmail(email: string) {
  const normalizedEmail = email.trim()

  if (
    !normalizedEmail ||
    normalizedEmail.length > 320 ||
    !AUTHENTICATION_EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "Enter a valid email address."
  }

  return undefined
}

/** Validates six-digit Better Auth email one-time password codes. */
export function validateAuthenticationOtp(otp: string) {
  if (!AUTHENTICATION_OTP_PATTERN.test(otp)) {
    return "Enter the 6-digit code."
  }

  return undefined
}

/** Masks authentication email local-part while keeping recipient recognizable. */
export function maskAuthenticationEmail(email: string) {
  const atIndex = email.lastIndexOf("@")

  if (atIndex <= 0) {
    return email
  }

  return `${email[0]}***${email.slice(atIndex)}`
}

function getAuthenticationFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

/** Renders passwordless email OTP sign-in or verified account creation. */
export function AuthenticationFormCard({
  callbackPath = "/chat",
  className,
  emailOtpEnabled,
  googleEnabled,
  initialErrorMessage,
  mode,
}: AuthenticationFormCardProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage ?? null
  )
  const [verificationRequest, setVerificationRequest] =
    useState<AuthenticationVerificationRequest | null>(null)
  const [isGooglePending, setIsGooglePending] = useState(false)
  const isSignUp = mode === "sign-up"
  const isVerificationStep = verificationRequest !== null
  const title = isVerificationStep
    ? "Check your email"
    : isSignUp
      ? "Create your account"
      : "Welcome back"
  const description = !emailOtpEnabled
    ? "Email one-time password sign-in is unavailable."
    : isVerificationStep
      ? `A one-time password was sent to ${maskAuthenticationEmail(verificationRequest.email)}.`
      : isSignUp
        ? "Sign up with a one-time password"
        : "Sign in to your account"

  async function sendAuthenticationCode(email: string) {
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })

      if (result.error) {
        setErrorMessage("Could not send a one-time password. Try again.")
        return false
      }

      return true
    } catch {
      setErrorMessage("Authentication is unavailable. Try again.")
      return false
    }
  }

  const form = useForm({
    defaultValues: defaultAuthenticationFormValues,
    onSubmit: async ({ value }) => {
      setErrorMessage(null)

      if (!verificationRequest) {
        const email = value.email.trim()
        const username = value.username.trim()

        if (!(await sendAuthenticationCode(email))) {
          return
        }

        setVerificationRequest({ email, username })
        return
      }

      try {
        const result = isSignUp
          ? await authClient.signIn.emailOtp({
              email: verificationRequest.email,
              name: verificationRequest.username,
              otp: value.otp,
              username: verificationRequest.username,
            })
          : await authClient.signIn.emailOtp({
              email: verificationRequest.email,
              otp: value.otp,
            })

        if (result.error) {
          if (!isSignUp && result.error.code === "SIGN_UP_REQUIRED") {
            resetAuthenticationRequest()
            setErrorMessage("No account found. Sign up to create one.")
            return
          }

          if (isSignUp && result.error.code === "USERNAME_IS_ALREADY_TAKEN") {
            resetAuthenticationRequest()
            setErrorMessage("Username is unavailable. Choose another.")
            return
          }

          setErrorMessage("Code is invalid or expired. Try again.")
          resetVerificationCode()
          return
        }

        const callbackUrl = new URL(
          callbackPath,
          window.location.origin
        ).toString()
        window.location.assign(callbackUrl)
      } catch {
        setErrorMessage("Authentication is unavailable. Try again.")
        resetVerificationCode()
      }
    },
  })

  function resetVerificationCode() {
    form.resetField("otp")
    requestAnimationFrame(() => {
      document.getElementById("verification-code")?.focus()
    })
  }

  function resetAuthenticationRequest() {
    setErrorMessage(null)
    setVerificationRequest(null)
    form.resetField("otp")
    requestAnimationFrame(() => {
      document.getElementById("email")?.focus()
    })
  }

  async function signInWithGoogle() {
    setErrorMessage(null)
    setIsGooglePending(true)

    try {
      const path = isSignUp ? "/sign-up" : "/sign-in"
      const callbackUrl = new URL(
        callbackPath,
        window.location.origin
      ).toString()
      const errorCallbackUrl = new URL(path, window.location.origin)

      errorCallbackUrl.searchParams.set("error", "oauth")
      if (callbackPath !== "/chat") {
        errorCallbackUrl.searchParams.set("callbackURL", callbackPath)
      }

      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
        errorCallbackURL: errorCallbackUrl.toString(),
      })

      if (error) {
        setErrorMessage("Could not continue with Google. Try again.")
      }
    } catch {
      setErrorMessage("Authentication is unavailable. Try again.")
    } finally {
      setIsGooglePending(false)
    }
  }

  const alternateAuthenticationPath = isSignUp ? "/sign-in" : "/sign-up"
  const alternateAuthenticationHref =
    callbackPath === "/chat"
      ? alternateAuthenticationPath
      : `${alternateAuthenticationPath}?callbackURL=${encodeURIComponent(callbackPath)}`

  return (
    <Card
      className={cn(
        "w-full max-w-md [--card-spacing:--spacing(6)] dark:inset-ring dark:inset-ring-foreground/5 dark:shadow-none dark:ring-0",
        className
      )}
    >
      <CardHeader className="justify-items-center gap-2 text-center">
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

      <CardContent className="flex flex-col gap-6">
        {!emailOtpEnabled && (
          <Alert variant="destructive">
            <AlertTitle>Email sign-in unavailable</AlertTitle>
            <AlertDescription>
              {googleEnabled
                ? "Continue with Google or try again later."
                : "Try again later."}
            </AlertDescription>
          </Alert>
        )}

        <FieldError className="text-center" id="authentication-error">
          {errorMessage}
        </FieldError>

        {!isVerificationStep && googleEnabled && (
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <AuthenticationGoogleButton
                disabled={isSubmitting || isGooglePending}
                onClick={() => void signInWithGoogle()}
              />
            )}
          </form.Subscribe>
        )}

        {!isVerificationStep && googleEnabled && emailOtpEnabled && (
          <div aria-hidden="true" className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
        )}

        {emailOtpEnabled && (
          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <FieldGroup className="gap-4">
              {!isVerificationStep && isSignUp && (
                <form.Field
                  name="username"
                  validators={{
                    onChange: ({ value }) =>
                      validateAuthenticationUsername(value),
                  }}
                >
                  {(field) => {
                    const error = getAuthenticationFieldError(
                      field.state.meta.errors
                    )
                    const descriptionId = "username-message"
                    const errorId = "username-error"

                    return (
                      <AuthenticationField
                        description="3–31 letters, numbers, underscores, or periods."
                        descriptionId={descriptionId}
                        error={error}
                        errorId={errorId}
                        htmlFor="username"
                        invalid={!field.state.meta.isValid}
                        label="Username"
                      >
                        <Input
                          aria-describedby={
                            [descriptionId, error ? errorId : undefined]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                          aria-invalid={!field.state.meta.isValid}
                          autoCapitalize="none"
                          autoComplete="username"
                          autoCorrect="off"
                          className="h-11"
                          id="username"
                          maxLength={31}
                          minLength={3}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          pattern="[A-Za-z0-9_.]+"
                          required
                          spellCheck={false}
                          type="text"
                          value={field.state.value}
                        />
                      </AuthenticationField>
                    )
                  }}
                </form.Field>
              )}

              {!isVerificationStep && (
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => validateAuthenticationEmail(value),
                  }}
                >
                  {(field) => {
                    const error = getAuthenticationFieldError(
                      field.state.meta.errors
                    )
                    const errorId = "email-error"

                    return (
                      <AuthenticationField
                        error={error}
                        errorId={errorId}
                        htmlFor="email"
                        invalid={!field.state.meta.isValid}
                        label="Email"
                      >
                        <Input
                          aria-describedby={error ? errorId : undefined}
                          aria-invalid={!field.state.meta.isValid}
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          className="h-11"
                          id="email"
                          maxLength={320}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          placeholder="m@example.com"
                          required
                          spellCheck={false}
                          type="email"
                          value={field.state.value}
                        />
                      </AuthenticationField>
                    )
                  }}
                </form.Field>
              )}

              {isVerificationStep && (
                <form.Field
                  name="otp"
                  validators={{
                    onChange: ({ value }) => validateAuthenticationOtp(value),
                  }}
                >
                  {(field) => {
                    const error = getAuthenticationFieldError(
                      field.state.meta.errors
                    )
                    const errorId = "otp-error"
                    const invalid = !field.state.meta.isValid

                    return (
                      <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <Field
                            className="items-center"
                            data-invalid={invalid || undefined}
                          >
                            <FieldLabel
                              className="sr-only"
                              htmlFor="verification-code"
                            >
                              One-time password
                            </FieldLabel>
                            <InputOTP
                              aria-describedby={error ? errorId : undefined}
                              aria-invalid={invalid}
                              autoComplete="one-time-code"
                              autoFocus
                              containerClassName="justify-center"
                              disabled={isSubmitting}
                              id="verification-code"
                              maxLength={6}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={field.handleChange}
                              onComplete={() => {
                                if (!isSubmitting) {
                                  void form.handleSubmit()
                                }
                              }}
                              pattern={REGEXP_ONLY_DIGITS}
                              required
                              value={field.state.value}
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
                              {isSubmitting
                                ? "Verifying one-time password…"
                                : ""}
                            </span>
                          </Field>
                        )}
                      </form.Subscribe>
                    )
                  }}
                </form.Field>
              )}
            </FieldGroup>

            {!isVerificationStep && (
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    className="h-11 w-full touch-manipulation"
                    disabled={isSubmitting || isGooglePending}
                    type="submit"
                  >
                    {isSubmitting ? "Sending…" : "Send one-time password"}
                  </Button>
                )}
              </form.Subscribe>
            )}

            {isVerificationStep && (
              <Button
                className="h-11 touch-manipulation"
                onClick={resetAuthenticationRequest}
                type="button"
                variant="link"
              >
                Use a different email
              </Button>
            )}
          </form>
        )}
      </CardContent>

      {!isVerificationStep && (
        <CardFooter className="flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <Link
            className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            href={alternateAuthenticationHref}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
