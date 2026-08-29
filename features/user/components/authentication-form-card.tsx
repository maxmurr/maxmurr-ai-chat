"use client"

import { useForm } from "@tanstack/react-form"
import { CircleAlertIcon } from "lucide-react"
import { useState } from "react"

import { AuthenticationField } from "@/features/user/components/authentication-field"
import {
  AuthenticationAlternateLink,
  AuthenticationFormHeader,
  AuthenticationOtpField,
} from "@/features/user/components/authentication-form-sections"
import {
  getAuthenticationFieldError,
  maskAuthenticationEmail,
  validateAuthenticationEmail,
  validateAuthenticationOtp,
  validateAuthenticationUsername,
} from "@/features/user/user-authentication-validation"
import { AuthenticationGoogleButton } from "@/features/user/components/authentication-google-button"
import {
  sendUserAuthenticationCodeAction,
  signInUserWithEmailOtpAction,
  startGoogleAuthenticationAction,
} from "@/features/user/user-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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

const defaultAuthenticationFormValues: AuthenticationFormValues = {
  email: "",
  otp: "",
  username: "",
}

export {
  maskAuthenticationEmail,
  validateAuthenticationEmail,
  validateAuthenticationOtp,
  validateAuthenticationUsername,
} from "@/features/user/user-authentication-validation"

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
      const result = await sendUserAuthenticationCodeAction(email)

      if (!result.ok) {
        setErrorMessage(result.error)
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
        const result = await signInUserWithEmailOtpAction({
          email: verificationRequest.email,
          mode,
          otp: value.otp,
          username: verificationRequest.username,
        })

        if (!result.ok) {
          if (!isSignUp && result.code === "SIGN_UP_REQUIRED") {
            resetAuthenticationRequest()
            setErrorMessage("No account found. Sign up to create one.")
            return
          }

          if (isSignUp && result.code === "USERNAME_IS_ALREADY_TAKEN") {
            resetAuthenticationRequest()
            setErrorMessage("Username is unavailable. Choose another.")
            return
          }

          setErrorMessage("Code is invalid or expired. Try again.")
          resetVerificationCode()
          return
        }

        window.location.assign(new URL(callbackPath, window.location.origin))
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
      const result = await startGoogleAuthenticationAction(callbackPath, mode)

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      window.location.assign(result.url)
    } catch {
      setErrorMessage("Authentication is unavailable. Try again.")
    } finally {
      setIsGooglePending(false)
    }
  }

  return (
    <Card
      className={cn(
        "w-full max-w-md [--card-spacing:--spacing(6)] dark:shadow-none dark:ring-0 dark:inset-ring dark:inset-ring-foreground/5",
        className
      )}
    >
      <AuthenticationFormHeader
        description={description}
        isVerificationStep={isVerificationStep}
        title={title}
      />

      <CardContent className="flex flex-col gap-6">
        {!emailOtpEnabled && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Email sign-in unavailable</AlertTitle>
            <AlertDescription>
              {googleEnabled
                ? "Continue with Google or try again later."
                : "Try again later."}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription id="authentication-error">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

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
                    const invalid = !field.state.meta.isValid

                    return (
                      <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <AuthenticationOtpField
                            disabled={isSubmitting}
                            error={error}
                            invalid={invalid}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={field.handleChange}
                            onComplete={() => {
                              if (!isSubmitting) {
                                void form.handleSubmit()
                              }
                            }}
                            value={field.state.value}
                          />
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
        <AuthenticationAlternateLink
          callbackPath={callbackPath}
          isSignUp={isSignUp}
        />
      )}
    </Card>
  )
}
