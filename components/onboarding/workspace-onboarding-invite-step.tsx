"use client"

import { useForm } from "@tanstack/react-form"

import { WorkspaceOnboardingStepHeader } from "@/components/onboarding/workspace-onboarding-step-header"
import {
  getOnboardingFieldError,
  parseOnboardingInviteEmails,
  validateOnboardingInviteEmails,
} from "@/components/onboarding/workspace-onboarding-validation"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type WorkspaceOnboardingInviteStepProps = {
  className?: string
  errorMessage: string | null
  onErrorClear: () => void
  onSkip: () => void
  onSubmit: (emails: string[]) => Promise<void>
}

/** Collects optional teammate invitations after workspace creation. */
export function WorkspaceOnboardingInviteStep({
  className,
  errorMessage,
  onErrorClear,
  onSkip,
  onSubmit,
}: WorkspaceOnboardingInviteStepProps) {
  const form = useForm({
    defaultValues: { teammateEmails: "" },
    onSubmit: async ({ value }) =>
      onSubmit(parseOnboardingInviteEmails(value.teammateEmails)),
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <WorkspaceOnboardingStepHeader
        description={
          <>
            <span translate="no">AI Chat</span> works better with more people.
            Add your core collaborators.
          </>
        }
        title="Invite your teammates"
        titleId="workspace-onboarding-title"
      />

      <FieldGroup>
        <form.Field
          name="teammateEmails"
          validators={{
            onChange: ({ value }) => validateOnboardingInviteEmails(value),
          }}
        >
          {(field) => {
            const fieldError = getOnboardingFieldError(
              field.state.meta.errors,
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
                      onErrorClear()
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
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <>
                        <Button
                          className="h-11 sm:h-8"
                          disabled={isSubmitting}
                          onClick={onSkip}
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
                          {isSubmitting && <Spinner data-icon="inline-start" />}
                          {isSubmitting ? "Inviting…" : "Next"}
                        </Button>
                      </>
                    )}
                  </form.Subscribe>
                </Field>
              </>
            )
          }}
        </form.Field>
      </FieldGroup>
    </form>
  )
}
