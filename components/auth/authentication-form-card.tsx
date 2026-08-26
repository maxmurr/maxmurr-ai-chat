"use client"

import Image from "next/image"
import Link from "next/link"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

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

type AuthenticationMode = "sign-in" | "sign-up"

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password"
  describedBy?: string
  id: string
  label: string
  name: string
}

function PasswordField({
  autoComplete,
  describedBy,
  id,
  label,
  name,
}: PasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <InputGroup className="h-11 sm:h-10">
      <InputGroupInput
        id={id}
        name={name}
        type={isPasswordVisible ? "text" : "password"}
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        minLength={6}
        maxLength={31}
        required
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          className="relative"
          aria-controls={id}
          aria-label={`${isPasswordVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isPasswordVisible}
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
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

function preventUnconfiguredAuthentication(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

/** Renders shared sign-in or sign-up card without backend auth wiring. */
export function AuthenticationFormCard({
  mode,
}: {
  mode: AuthenticationMode
}) {
  const isSignUp = mode === "sign-up"
  const title = isSignUp ? "Sign Up" : "Sign In"
  const description = isSignUp
    ? "Choose a username and password to get started."
    : "Enter your username and password to continue."

  return (
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
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
          onSubmit={preventUnconfiguredAuthentication}
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="username" className="leading-none">
                Username
              </FieldLabel>
              <Input
                id="username"
                name="username"
                type="text"
                className="h-11 sm:h-10"
                aria-describedby={isSignUp ? "username-message" : undefined}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                minLength={3}
                maxLength={31}
                required
                autoFocus={isSignUp}
              />
              {isSignUp && (
                <FieldDescription
                  id="username-message"
                  className="text-sm sm:text-xs"
                >
                  3–31 characters.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="leading-none">
                Password
              </FieldLabel>
              <PasswordField
                id="password"
                name="password"
                label="Password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                describedBy={isSignUp ? "password-message" : undefined}
              />
              {isSignUp && (
                <FieldDescription
                  id="password-message"
                  className="text-sm sm:text-xs"
                >
                  At least 6 characters.
                </FieldDescription>
              )}
            </Field>

            {isSignUp && (
              <Field>
                <FieldLabel
                  htmlFor="confirm-password"
                  className="leading-none"
                >
                  Confirm password
                </FieldLabel>
                <PasswordField
                  id="confirm-password"
                  name="confirm_password"
                  label="Confirm password"
                  autoComplete="new-password"
                />
              </Field>
            )}
          </FieldGroup>

          <Button
            type="submit"
            className="h-11 w-full touch-manipulation sm:h-10"
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="flex flex-col gap-4">
          <div aria-hidden="true" className="flex items-center gap-3">
            <Separator className="flex-1" />
            <p className="text-xs tracking-wider text-muted-foreground uppercase">
              or
            </p>
            <Separator className="flex-1" />
          </div>

          <Button
            nativeButton={false}
            render={<a href="/api/auth/google" />}
            variant="outline"
            className="h-11 w-full touch-manipulation sm:h-10"
          >
            <Image
              src="/google-logo.svg"
              alt=""
              width={16}
              height={16}
              data-icon="inline-start"
              className="size-4 shrink-0"
            />
            <span>
              Continue with <span translate="no">Google</span>
            </span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </span>
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </Link>
      </CardFooter>
    </Card>
  )
}
