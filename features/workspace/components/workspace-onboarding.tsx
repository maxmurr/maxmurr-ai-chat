import { Skeleton } from "@/components/ui/skeleton"
import { WorkspaceOnboardingForm } from "@/features/workspace/components/workspace-onboarding-form"
import { getWorkspaceOnboardingState } from "@/features/workspace/workspace-queries"

/** Verifies first-workspace state before rendering onboarding form. */
export async function WorkspaceOnboarding() {
  await getWorkspaceOnboardingState()
  return <WorkspaceOnboardingForm />
}

/** Reserves onboarding progress and form while workspace state loads. */
export function WorkspaceOnboardingSkeleton() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-8">
      <Skeleton className="h-2 w-16" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}
