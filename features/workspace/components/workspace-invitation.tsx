import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkspaceInvitationCard } from "@/features/workspace/components/workspace-invitation-card"
import { acceptWorkspaceInvitationAction } from "@/features/workspace/workspace-actions"
import { getWorkspaceInvitationPageData } from "@/features/workspace/workspace-queries"

/** Loads verified-user workspace invitation and acceptance action. */
export async function WorkspaceInvitation({
  hasError,
  invitationId,
}: {
  hasError: boolean
  invitationId: string
}) {
  const { invitation, userEmail } =
    await getWorkspaceInvitationPageData(invitationId)

  if (!invitation) {
    return <WorkspaceInvitationUnavailable />
  }

  const acceptInvitationAction = acceptWorkspaceInvitationAction.bind(
    null,
    invitationId
  )

  return (
    <WorkspaceInvitationCard
      contentClassName="flex flex-col gap-4"
      description={`${invitation.inviterEmail} invited you to this workspace.`}
      footer={
        <form action={acceptInvitationAction} className="w-full">
          <Button className="h-11 w-full touch-manipulation" type="submit">
            Accept invitation
          </Button>
        </form>
      }
      title={`Join ${invitation.organizationName}`}
    >
      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>Invitation not accepted</AlertTitle>
          <AlertDescription>
            Try again. Link may have expired.
          </AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">
        Invitation matches {userEmail}.
      </p>
    </WorkspaceInvitationCard>
  )
}

function WorkspaceInvitationUnavailable() {
  return (
    <WorkspaceInvitationCard
      description="Link expired, was already used, or belongs to another email address."
      footer="Sign in with invited email, then open link again."
      footerClassName="text-sm text-muted-foreground"
      title="Invitation unavailable"
    />
  )
}

/** Reserves workspace invitation card while session and invitation load. */
export function WorkspaceInvitationSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-4 p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  )
}
