import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  WorkspaceOnboarding,
  WorkspaceOnboardingSkeleton,
} from "@/features/workspace/components/workspace-onboarding";

/** Composes first-workspace onboarding with its post-setup destination. */
export default function OnboardingPage({
  searchParams,
}: PageProps<"/onboarding">) {
  return (
    <main
      className="isolate flex min-h-dvh w-full items-start justify-center bg-background px-4 py-12 sm:items-center sm:px-6 sm:py-16"
      data-testid="onboarding-shell"
      id="main-content"
    >
      <ErrorBoundary title="Onboarding did not load">
        <Suspense fallback={<WorkspaceOnboardingSkeleton />}>
          {searchParams.then(({ callbackURL }) => (
            <WorkspaceOnboarding
              callbackValue={
                typeof callbackURL === "string" ? callbackURL : undefined
              }
            />
          ))}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
