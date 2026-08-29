import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  WorkspaceInvitation,
  WorkspaceInvitationSkeleton,
} from "@/features/workspace/components/workspace-invitation"

export const metadata: Metadata = {
  title: "Workspace Invitation · AI Chat",
  description: "Accept an AI Chat workspace invitation.",
}

/** Composes workspace invitation from resolved route and query values. */
export default function AcceptWorkspaceInvitationPage({
  params,
  searchParams,
}: PageProps<"/accept-invitation/[invitationId]">) {
  return (
    <div className="flex w-full max-w-md" data-testid="invitation-shell">
      <ErrorBoundary title="Invitation did not load">
        <Suspense fallback={<WorkspaceInvitationSkeleton />}>
          {Promise.all([params, searchParams]).then(
            ([{ invitationId }, { error }]) => (
              <WorkspaceInvitation
                hasError={typeof error === "string"}
                invitationId={invitationId}
              />
            )
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
