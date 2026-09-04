import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceOnboardingForm } from "@/features/workspace/components/workspace-onboarding-form";
import { getWorkspaceOnboardingState } from "@/features/workspace/workspace-queries";

/** Verifies first-workspace state before rendering onboarding form. */
export async function WorkspaceOnboarding({
  callbackValue,
}: {
  callbackValue?: string;
}) {
  const { callbackPath } = await getWorkspaceOnboardingState(callbackValue);
  return <WorkspaceOnboardingForm callbackPath={callbackPath} />;
}

/** Reserves onboarding progress and form while workspace state loads. */
export function WorkspaceOnboardingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading workspace onboarding"
      className="flex w-full max-w-xs min-w-0 flex-col gap-8"
    >
      <Skeleton className="h-2 w-16" />
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-8 w-2/3 max-w-48" />
          <Skeleton className="h-5 w-full sm:h-4" />
          <Skeleton className="h-5 w-4/5 sm:h-4" />
        </div>
        <Skeleton className="h-11 w-full sm:h-8" />
        <Skeleton className="ml-auto h-11 w-20 sm:h-8" />
      </div>
    </div>
  );
}
