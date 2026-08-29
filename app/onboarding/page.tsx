import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  WorkspaceOnboarding,
  WorkspaceOnboardingSkeleton,
} from "@/features/workspace/components/workspace-onboarding"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Composes first-workspace onboarding. */
export default function OnboardingPage() {
  return (
    <main
      className="isolate flex min-h-dvh w-full items-start justify-center bg-background px-4 py-12 sm:items-center sm:px-6 sm:py-16"
      id="main-content"
    >
      <ErrorBoundary title="Onboarding did not load">
        <Suspense fallback={<WorkspaceOnboardingSkeleton />}>
          <WorkspaceOnboarding />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
