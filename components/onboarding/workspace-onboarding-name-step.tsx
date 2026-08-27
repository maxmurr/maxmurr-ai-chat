"use client"

import { useForm } from "@tanstack/react-form"

import { WorkspaceOnboardingStepHeader } from "@/components/onboarding/workspace-onboarding-step-header"
import {
  getOnboardingFieldError,
  ONBOARDING_WORKSPACE_NAME_MAX_LENGTH,
  validateOnboardingWorkspaceName,
} from "@/components/onboarding/workspace-onboarding-validation"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type WorkspaceOnboardingNameStepProps = {
  className?: string
  errorMessage: string | null
  onErrorClear: () => void
  onSubmit: (workspaceName: string) => Promise<void>
}

/** Collects and submits first workspace name during onboarding. */
export function WorkspaceOnboardingNameStep({
  className,
  errorMessage,
  onErrorClear,
  onSubmit,
}: WorkspaceOnboardingNameStepProps) {
  const form = useForm({
    defaultValues: { workspaceName: "" },
    onSubmit: async ({ value }) => onSubmit(value.workspaceName.trim()),
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
        description="Choose something your team will recognize, like your organization or team name. You can update it later."
        title="Name your workspace"
        titleId="workspace-onboarding-title"
      />

      <FieldGroup>
        <form.Field
          name="workspaceName"
          validators={{
            onChange: ({ value }) => validateOnboardingWorkspaceName(value),
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
                        onErrorClear()
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
                  <form.Subscribe selector={(state) => state.isSubmitting}>
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
                        {isSubmitting && <Spinner data-icon="inline-start" />}
                        {isSubmitting ? "Creating…" : "Next"}
                      </Button>
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
