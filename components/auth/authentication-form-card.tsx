"use client"

import { useForm } from "@tanstack/react-form"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"

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

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password"
  describedBy?: string
  id: string
  invalid: boolean
  label: string
  name: string
  onBlur: () => void
  onChange: (password: string) => void
  value: string
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

function PasswordField({
  autoComplete,
  describedBy,
  id,
  invalid,
  label,
  name,
  onBlur,
  onChange,
  value,
}: PasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <InputGroup className="h-11 sm:h-10">
      <InputGroupInput
        aria-describedby={describedBy}
        aria-invalid={invalid}
        autoComplete={autoComplete}
        id={id}
        maxLength={128}
        minLength={8}
        name={name}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        required
        type={isPasswordVisible ? "text" : "password"}
        value={value}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-controls={id}
          aria-label={`${isPasswordVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isPasswordVisible}
          className="relative"
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          size="icon-sm"
          type="button"
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-1/2 pointer-fine:hidden"
          />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
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
  googleEnabled,
  initialErrorMessage,
  mode,
}: {
  googleEnabled: boolean
  initialErrorMessage?: string
  mode: AuthenticationMode
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage ?? null
  )
  const [isGooglePending, setIsGooglePending] = useState(false)
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

      setErrorMessage(null)

      try {
        const result = isSignUp
          ? await authClient.signUp.email({
              email: value.identity.email.trim(),
              name: username,
              password,
              username,
            })
          : await authClient.signIn.username({ username, password })

        if (result.error) {
          setErrorMessage(
            isSignUp
              ? "Could not create account. Check your details or sign in."
              : "Invalid username or password."
          )
          return
        }

        window.location.assign(new URL("/chat", window.location.origin))
      } catch {
        setErrorMessage("Authentication is unavailable. Try again.")
      }
    },
  })

  async function signInWithGoogle() {
    setErrorMessage(null)
    setIsGooglePending(true)

    try {
      const path = isSignUp ? "/sign-up" : "/sign-in"
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: new URL("/chat", window.location.origin).toString(),
        errorCallbackURL: new URL(path, window.location.origin).toString(),
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

  return (
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)] dark:inset-ring dark:inset-ring-foreground/5 dark:shadow-none dark:ring-0">
      <CardHeader>
        <h1 className="text-balance font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-6">
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
                  <Field
                    data-invalid={
                      field.state.meta.isValid ? undefined : true
                    }
                  >
                    <FieldLabel htmlFor="username" className="leading-none">
                      Username
                    </FieldLabel>
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
                    {isSignUp && (
                      <FieldDescription
                        className="text-sm sm:text-xs"
                        id={descriptionId}
                      >
                        3–31 letters, numbers, underscores, or periods.
                      </FieldDescription>
                    )}
                    <FieldError id={errorId}>{error}</FieldError>
                  </Field>
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
                    <Field
                      data-invalid={
                        field.state.meta.isValid ? undefined : true
                      }
                    >
                      <FieldLabel htmlFor="email" className="leading-none">
                        Email
                      </FieldLabel>
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
                      <FieldError id={errorId}>{error}</FieldError>
                    </Field>
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
                  <Field
                    data-invalid={
                      field.state.meta.isValid ? undefined : true
                    }
                  >
                    <FieldLabel htmlFor="password" className="leading-none">
                      Password
                    </FieldLabel>
                    <PasswordField
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      describedBy={
                        [descriptionId, error ? errorId : undefined]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      id="password"
                      invalid={!field.state.meta.isValid}
                      label="Password"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      value={field.state.value}
                    />
                    {isSignUp && (
                      <FieldDescription
                        className="text-sm sm:text-xs"
                        id={descriptionId}
                      >
                        8–128 characters.
                      </FieldDescription>
                    )}
                    <FieldError id={errorId}>{error}</FieldError>
                  </Field>
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
                    <Field
                      data-invalid={
                        field.state.meta.isValid ? undefined : true
                      }
                    >
                      <FieldLabel
                        className="leading-none"
                        htmlFor="confirm-password"
                      >
                        Confirm password
                      </FieldLabel>
                      <PasswordField
                        autoComplete="new-password"
                        describedBy={error ? errorId : undefined}
                        id="confirm-password"
                        invalid={!field.state.meta.isValid}
                        label="Confirm password"
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={field.handleChange}
                        value={field.state.value}
                      />
                      <FieldError id={errorId}>{error}</FieldError>
                    </Field>
                  )
                }}
              </form.Field>
            )}
          </FieldGroup>

          <FieldError id="authentication-error" className="text-center">
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
          <div className="flex flex-col gap-4">
            <div aria-hidden="true" className="flex items-center gap-3">
              <Separator className="flex-1" />
              <p className="text-xs tracking-wider text-muted-foreground uppercase">
                or
              </p>
              <Separator className="flex-1" />
            </div>

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  className="h-11 w-full touch-manipulation sm:h-10"
                  disabled={isSubmitting || isGooglePending}
                  onClick={() => void signInWithGoogle()}
                  type="button"
                  variant="outline"
                >
                  <span data-icon="inline-start" className="size-4 shrink-0">
                    <Image
                      alt=""
                      className="size-4 dark:hidden"
                      height={16}
                      src="/google-logo.svg"
                      width={16}
                    />
                    <Image
                      alt=""
                      className="hidden size-4 dark:block"
                      height={16}
                      src="/google-logo-dark.svg"
                      width={16}
                    />
                  </span>
                  <span>
                    Continue with <span translate="no">Google</span>
                  </span>
                </Button>
              )}
            </form.Subscribe>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </span>
        <Link
          className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          href={isSignUp ? "/sign-in" : "/sign-up"}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </Link>
      </CardFooter>
    </Card>
  )
}
