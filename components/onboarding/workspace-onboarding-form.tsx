"use client"

import { useState } from "react"

import { WorkspaceOnboardingInviteStep } from "@/components/onboarding/workspace-onboarding-invite-step"
import { WorkspaceOnboardingNameStep } from "@/components/onboarding/workspace-onboarding-name-step"
import { Progress } from "@/components/ui/progress"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

export {
  parseOnboardingInviteEmails,
  validateOnboardingInviteEmails,
  validateOnboardingWorkspaceName,
} from "@/components/onboarding/workspace-onboarding-validation"

type OnboardingStep = "workspace" | "teammates"

function finishWorkspaceOnboarding() {
  window.location.assign(new URL("/chat", window.location.origin))
}

/** Creates first workspace, then offers optional teammate invitations. */
export function WorkspaceOnboardingForm({
  className,
}: {
  className?: string
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [step, setStep] = useState<OnboardingStep>("workspace")
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  async function createOnboardingWorkspace(workspaceName: string) {
    setErrorMessage(null)

    try {
      const { data, error } = await authClient.organization.create({
        name: workspaceName,
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
  }

  async function inviteOnboardingTeammates(emails: string[]) {
    if (!workspaceId) {
      setErrorMessage("Workspace is unavailable. Reload and try again.")
      return
    }

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
          }),
        ),
      )

      if (invitations.some(({ error }) => error)) {
        setErrorMessage(
          "Some invitations could not be created. Try again or skip this step.",
        )
        return
      }

      finishWorkspaceOnboarding()
    } catch {
      setErrorMessage(
        "Invitations are unavailable. Try again or skip this step.",
      )
    }
  }

  return (
    <section
      aria-labelledby="workspace-onboarding-title"
      className={cn("flex w-full max-w-xs flex-col gap-8", className)}
    >
      <Progress
        aria-label={`Onboarding step ${step === "workspace" ? 1 : 2} of 2`}
        className="w-16"
        value={step === "workspace" ? 50 : 100}
      />

      {step === "workspace" ? (
        <WorkspaceOnboardingNameStep
          errorMessage={errorMessage}
          onErrorClear={() => setErrorMessage(null)}
          onSubmit={createOnboardingWorkspace}
        />
      ) : (
        <WorkspaceOnboardingInviteStep
          errorMessage={errorMessage}
          onErrorClear={() => setErrorMessage(null)}
          onSkip={finishWorkspaceOnboarding}
          onSubmit={inviteOnboardingTeammates}
        />
      )}
    </section>
  )
}
