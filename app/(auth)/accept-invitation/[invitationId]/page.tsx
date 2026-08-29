import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  WorkspaceInvitation,
  WorkspaceInvitationSkeleton,
} from "@/features/workspace/components/workspace-invitation"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
  )
}
