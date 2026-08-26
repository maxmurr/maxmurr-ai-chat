"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

const ONBOARDING_WORKSPACE_NAME_MAX_LENGTH = 50
const ONBOARDING_INVITE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type OnboardingStep = "workspace" | "teammates"

/** Validates first-workspace name before organization creation. */
export function validateOnboardingWorkspaceName(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return "Enter a workspace name."
  }

  if (normalizedName.length > ONBOARDING_WORKSPACE_NAME_MAX_LENGTH) {
    return `Workspace name must have at most ${ONBOARDING_WORKSPACE_NAME_MAX_LENGTH} characters.`
  }

  return undefined
}

/** Parses comma-separated teammate emails for organization invitations. */
export function parseOnboardingInviteEmails(value: string) {
  return [...new Set(value.split(",").map((email) => email.trim().toLowerCase()))]
    .filter(Boolean)
}

/** Validates optional comma-separated teammate invitation emails. */
export function validateOnboardingInviteEmails(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const emails = value.split(",").map((email) => email.trim())

  if (
    emails.some(
      (email) =>
        !email ||
        email.length > 254 ||
        !ONBOARDING_INVITE_EMAIL_PATTERN.test(email)
    )
  ) {
    return "Enter valid email addresses separated by commas."
  }

  return undefined
}

function getOnboardingFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

function finishWorkspaceOnboarding() {
  window.location.assign(new URL("/chat", window.location.origin))
}

/** Creates first workspace, then offers optional teammate invitations. */
export function WorkspaceOnboardingForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [step, setStep] = useState<OnboardingStep>("workspace")
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const workspaceForm = useForm({
    defaultValues: { workspaceName: "" },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)

      try {
        const { data, error } = await authClient.organization.create({
          name: value.workspaceName.trim(),
          slug: crypto.randomUUID(),
        })

        if (error || !data) {
          setErrorMessage("Could not create workspace. Try again.")
          return
        }

        setWorkspaceId(data.id)
        setStep("teammates")
      } catch {
        setErrorMessage("Workspace creation is unavailable. Try again.")
      }
    },
  })
  const teammateForm = useForm({
    defaultValues: { teammateEmails: "" },
    onSubmit: async ({ value }) => {
      if (!workspaceId) {
        setErrorMessage("Workspace is unavailable. Reload and try again.")
        return
      }

      const emails = parseOnboardingInviteEmails(value.teammateEmails)

      if (emails.length === 0) {
        finishWorkspaceOnboarding()
        return
      }

      setErrorMessage(null)

      try {
        const invitations = await Promise.all(
          emails.map((email) =>
            authClient.organization.inviteMember({
              email,
              organizationId: workspaceId,
              role: "member",
            })
          )
        )

        if (invitations.some(({ error }) => error)) {
          setErrorMessage(
            "Some invitations could not be created. Try again or skip this step."
          )
          return
        }

        finishWorkspaceOnboarding()
      } catch {
        setErrorMessage(
          "Invitations are unavailable. Try again or skip this step."
        )
      }
    },
  })

  return (
    <section
      aria-labelledby="workspace-onboarding-title"
      className="flex w-full max-w-xs flex-col gap-8"
    >
      <Progress
        aria-label={`Onboarding step ${step === "workspace" ? 1 : 2} of 2`}
        className="w-16"
        value={step === "workspace" ? 50 : 100}
      />

      {step === "workspace" ? (
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void workspaceForm.handleSubmit()
          }}
        >
          <header className="flex flex-col gap-2">
            <h1
              className="text-balance text-2xl font-semibold tracking-tight"
              id="workspace-onboarding-title"
            >
              Name your workspace
            </h1>
            <p className="text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
              Choose something your team will recognize, like your organization
              or team name. You can update it later.
            </p>
          </header>

          <FieldGroup>
            <workspaceForm.Field
              name="workspaceName"
              validators={{
                onChange: ({ value }) =>
                  validateOnboardingWorkspaceName(value),
              }}
            >
              {(field) => {
                const fieldError = getOnboardingFieldError(
                  field.state.meta.errors
                )
                const displayedError = fieldError ?? errorMessage
                const isInvalid = Boolean(displayedError)

                return (
                  <>
                    <Field data-invalid={isInvalid ? true : undefined}>
                      <FieldLabel
                        className="sr-only"
                        htmlFor="onboarding-workspace-name"
                      >
                        Workspace name
                      </FieldLabel>
                      <InputGroup className="h-11 sm:h-8">
                        <InputGroupInput
                          aria-invalid={isInvalid}
                          autoComplete="organization"
                          autoFocus
                          id="onboarding-workspace-name"
                          maxLength={ONBOARDING_WORKSPACE_NAME_MAX_LENGTH}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(event.target.value)
                            setErrorMessage(null)
                          }}
                          placeholder="Acme Inc."
                          required
                          value={field.state.value}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText className="tabular-nums">
                            {ONBOARDING_WORKSPACE_NAME_MAX_LENGTH -
                              field.state.value.length}
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError className="text-base sm:text-sm">
                        {displayedError}
                      </FieldError>
                    </Field>

                    <Field className="justify-end" orientation="horizontal">
                      <workspaceForm.Subscribe
                        selector={(state) => state.isSubmitting}
                      >
                        {(isSubmitting) => (
                          <Button
                            className="h-11 sm:h-8"
                            disabled={
                              isSubmitting ||
                              !field.state.meta.isValid ||
                              !field.state.value.trim()
                            }
                            type="submit"
                          >
                            {isSubmitting && (
                              <Spinner data-icon="inline-start" />
                            )}
                            {isSubmitting ? "Creating…" : "Next"}
                          </Button>
                        )}
                      </workspaceForm.Subscribe>
                    </Field>
                  </>
                )
              }}
            </workspaceForm.Field>
          </FieldGroup>
        </form>
      ) : (
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void teammateForm.handleSubmit()
          }}
        >
          <header className="flex flex-col gap-2">
            <h1
              className="text-balance text-2xl font-semibold tracking-tight"
              id="workspace-onboarding-title"
            >
              Invite your teammates
            </h1>
            <p className="text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
              <span translate="no">AI Chat</span> works better with more people.
              Add your core collaborators.
            </p>
          </header>

          <FieldGroup>
            <teammateForm.Field
              name="teammateEmails"
              validators={{
                onChange: ({ value }) =>
                  validateOnboardingInviteEmails(value),
              }}
            >
              {(field) => {
                const fieldError = getOnboardingFieldError(
                  field.state.meta.errors
                )
                const displayedError = fieldError ?? errorMessage
                const isInvalid = Boolean(displayedError)

                return (
                  <>
                    <Field data-invalid={isInvalid ? true : undefined}>
                      <FieldLabel htmlFor="onboarding-teammate-emails">
                        Add teammates by email
                      </FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="h-11 sm:h-8"
                        id="onboarding-teammate-emails"
                        inputMode="email"
                        multiple
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          setErrorMessage(null)
                        }}
                        placeholder="alex@example.com, jamie@example.com"
                        spellCheck={false}
                        type="email"
                        value={field.state.value}
                      />
                      <FieldError className="text-base sm:text-sm">
                        {displayedError}
                      </FieldError>
                    </Field>

                    <Field className="justify-end" orientation="horizontal">
                      <teammateForm.Subscribe
                        selector={(state) => state.isSubmitting}
                      >
                        {(isSubmitting) => (
                          <>
                            <Button
                              className="h-11 sm:h-8"
                              disabled={isSubmitting}
                              onClick={finishWorkspaceOnboarding}
                              type="button"
                              variant="ghost"
                            >
                              Skip this step
                            </Button>
                            <Button
                              className="h-11 sm:h-8"
                              disabled={
                                isSubmitting || !field.state.meta.isValid
                              }
                              type="submit"
                            >
                              {isSubmitting && (
                                <Spinner data-icon="inline-start" />
                              )}
                              {isSubmitting ? "Inviting…" : "Next"}
                            </Button>
                          </>
                        )}
                      </teammateForm.Subscribe>
                    </Field>
                  </>
                )
              }}
            </teammateForm.Field>
          </FieldGroup>
        </form>
      )}
    </section>
  )
}
