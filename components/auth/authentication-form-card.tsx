"use client"

import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useState } from "react"

import { AuthenticationField } from "@/components/auth/authentication-field"
import { AuthenticationGoogleButton } from "@/components/auth/authentication-google-button"
import { AuthenticationPasswordVisibilityButton } from "@/components/auth/authentication-password-visibility-button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type AuthenticationMode = "sign-in" | "sign-up"

type AuthenticationFormValues = {
  identity: {
    email: string
    username: string
  }
  credentials: {
    password: string
    passwordConfirmation: string
  }
}

type AuthenticationFormCardProps = {
  callbackPath?: string
  className?: string
  googleEnabled: boolean
  initialErrorMessage?: string
  mode: AuthenticationMode
}

const AUTHENTICATION_USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/
const AUTHENTICATION_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const defaultAuthenticationFormValues: AuthenticationFormValues = {
  identity: {
    email: "",
    username: "",
  },
  credentials: {
    password: "",
    passwordConfirmation: "",
  },
}

/** Validates username syntax shared by sign-in and sign-up forms. */
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

/** Validates required sign-up email syntax. */
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

/** Validates Better Auth password length constraints. */
export function validateAuthenticationPassword(password: string) {
  if (password.length < 8 || password.length > 128) {
    return "Password must have 8–128 characters."
  }

  return undefined
}

/** Validates sign-up password confirmation against password field. */
export function validateAuthenticationPasswordConfirmation(
  password: string,
  passwordConfirmation: string
) {
  if (password !== passwordConfirmation) {
    return "Passwords do not match."
  }

  return undefined
}

function getAuthenticationFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

/** Renders Better Auth sign-in or account-creation controls. */
export function AuthenticationFormCard({
  callbackPath = "/chat",
  className,
  googleEnabled,
  initialErrorMessage,
  mode,
}: AuthenticationFormCardProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage ?? null
  )
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const [isGooglePending, setIsGooglePending] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] =
    useState(false)
  const isSignUp = mode === "sign-up"
  const title = isSignUp ? "Sign Up" : "Sign In"
  const description = isSignUp
    ? "Choose a username, email, and password to get started."
    : "Enter your username and password to continue."
  const form = useForm({
    defaultValues: defaultAuthenticationFormValues,
    onSubmit: async ({ value }) => {
      const username = value.identity.username.trim()
      const password = value.credentials.password
      const callbackUrl = new URL(
        callbackPath,
        window.location.origin
      ).toString()

      setErrorMessage(null)
      setNoticeMessage(null)

      try {
        const result = isSignUp
          ? await authClient.signUp.email({
              callbackURL: callbackUrl,
              email: value.identity.email.trim(),
              name: username,
              password,
              username,
            })
          : await authClient.signIn.username({
              callbackURL: callbackUrl,
              password,
              username,
            })

        if (result.error) {
          setErrorMessage(
            !isSignUp && result.error.status === 403
              ? "Verify your email before signing in. We sent a new link."
              : isSignUp
                ? "Could not create account. Check your details or sign in."
                : "Invalid username or password."
          )
          return
        }

        if (isSignUp && !result.data?.token) {
          setNoticeMessage(
            "Check for a verification link. If none arrives, try signing in."
          )
          return
        }

        window.location.assign(callbackUrl)
      } catch {
        setErrorMessage("Authentication is unavailable. Try again.")
      }
    },
  })

  async function signInWithGoogle() {
    setErrorMessage(null)
    setNoticeMessage(null)
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
      <CardHeader>
        <h1 className="text-balance font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-6">
        {noticeMessage && (
          <Alert>
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>{noticeMessage}</AlertDescription>
          </Alert>
        )}

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field
              name="identity.username"
              validators={{
                onChange: ({ value }) =>
                  validateAuthenticationUsername(value),
              }}
            >
              {(field) => {
                const error = getAuthenticationFieldError(
                  field.state.meta.errors
                )
                const descriptionId = isSignUp
                  ? "username-message"
                  : undefined
                const errorId = "username-error"

                return (
                  <AuthenticationField
                    description={
                      isSignUp
                        ? "3–31 letters, numbers, underscores, or periods."
                        : undefined
                    }
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
                      autoFocus
                      className="h-11 sm:h-10"
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

            {isSignUp && (
              <form.Field
                name="identity.email"
                validators={{
                  onChange: ({ value }) =>
                    validateAuthenticationEmail(value),
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
                        className="h-11 sm:h-10"
                        id="email"
                        maxLength={320}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
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

            <form.Field
              name="credentials.password"
              validators={{
                onChange: ({ value }) =>
                  validateAuthenticationPassword(value),
              }}
            >
              {(field) => {
                const error = getAuthenticationFieldError(
                  field.state.meta.errors
                )
                const descriptionId = isSignUp
                  ? "password-message"
                  : undefined
                const errorId = "password-error"

                return (
                  <AuthenticationField
                    description={isSignUp ? "8–128 characters." : undefined}
                    descriptionId={descriptionId}
                    error={error}
                    errorId={errorId}
                    htmlFor="password"
                    invalid={!field.state.meta.isValid}
                    label="Password"
                  >
                    <InputGroup className="h-11 sm:h-10">
                      <InputGroupInput
                        aria-describedby={
                          [descriptionId, error ? errorId : undefined]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                        aria-invalid={!field.state.meta.isValid}
                        autoComplete={
                          isSignUp ? "new-password" : "current-password"
                        }
                        id="password"
                        maxLength={128}
                        minLength={8}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        required
                        type={isPasswordVisible ? "text" : "password"}
                        value={field.state.value}
                      />
                      <AuthenticationPasswordVisibilityButton
                        inputId="password"
                        isVisible={isPasswordVisible}
                        label="Password"
                        onVisibilityChange={setIsPasswordVisible}
                      />
                    </InputGroup>
                  </AuthenticationField>
                )
              }}
            </form.Field>

            {isSignUp && (
              <form.Field
                name="credentials.passwordConfirmation"
                validators={{
                  onChangeListenTo: ["credentials.password"],
                  onChange: ({ value, fieldApi }) =>
                    validateAuthenticationPasswordConfirmation(
                      fieldApi.form.getFieldValue("credentials.password"),
                      value
                    ),
                }}
              >
                {(field) => {
                  const error = getAuthenticationFieldError(
                    field.state.meta.errors
                  )
                  const errorId = "confirm-password-error"

                  return (
                    <AuthenticationField
                      error={error}
                      errorId={errorId}
                      htmlFor="confirm-password"
                      invalid={!field.state.meta.isValid}
                      label="Confirm password"
                    >
                      <InputGroup className="h-11 sm:h-10">
                        <InputGroupInput
                          aria-describedby={error ? errorId : undefined}
                          aria-invalid={!field.state.meta.isValid}
                          autoComplete="new-password"
                          id="confirm-password"
                          maxLength={128}
                          minLength={8}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          required
                          type={
                            isPasswordConfirmationVisible
                              ? "text"
                              : "password"
                          }
                          value={field.state.value}
                        />
                        <AuthenticationPasswordVisibilityButton
                          inputId="confirm-password"
                          isVisible={isPasswordConfirmationVisible}
                          label="Confirm password"
                          onVisibilityChange={
                            setIsPasswordConfirmationVisible
                          }
                        />
                      </InputGroup>
                    </AuthenticationField>
                  )
                }}
              </form.Field>
            )}
          </FieldGroup>

          <FieldError className="text-center" id="authentication-error">
            {errorMessage}
          </FieldError>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                className="h-11 w-full touch-manipulation sm:h-10"
                disabled={isSubmitting || isGooglePending}
                type="submit"
              >
                {isSubmitting
                  ? isSignUp
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {googleEnabled && (
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <AuthenticationGoogleButton
                disabled={isSubmitting || isGooglePending}
                onClick={() => void signInWithGoogle()}
              />
            )}
          </form.Subscribe>
        )}
      </CardContent>

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
    </Card>
  )
}
