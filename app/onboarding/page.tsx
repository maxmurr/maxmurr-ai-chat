import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { WorkspaceOnboardingForm } from "@/components/onboarding/workspace-onboarding-form"
import { auth } from "@/di/authentication"

/** Requires a session with no workspaces before rendering onboarding. */
export default async function OnboardingPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    redirect("/sign-in")
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  })

  if (organizations.length > 0) {
    redirect("/chat")
  }

  return (
    <main
      className="isolate flex min-h-dvh w-full items-start justify-center bg-background px-4 py-12 sm:items-center sm:px-6 sm:py-16"
      id="main-content"
    >
      <WorkspaceOnboardingForm />
    </main>
  )
}
