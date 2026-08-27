import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { WorkspaceInvitationCard } from "@/components/auth/workspace-invitation-card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { auth } from "@/di/authentication"

export const metadata: Metadata = {
  title: "Workspace Invitation · AI Chat",
  description: "Accept an AI Chat workspace invitation.",
}

async function acceptWorkspaceInvitation(invitationId: string) {
  "use server"

  try {
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    })
  } catch {
    redirect(
      `/accept-invitation/${encodeURIComponent(invitationId)}?error=accept`
    )
  }

  redirect("/chat")
}

function InvitationUnavailableCard() {
  return (
    <WorkspaceInvitationCard
      description="Link expired, was already used, or belongs to another email address."
      footer="Sign in with invited email, then open link again."
      footerClassName="text-sm text-muted-foreground"
      title="Invitation unavailable"
    />
  )
}

/** Requires invited account before rendering workspace acceptance action. */
export default async function AcceptWorkspaceInvitationPage({
  params,
  searchParams,
}: PageProps<"/accept-invitation/[invitationId]">) {
  const [{ invitationId }, { error }, requestHeaders] = await Promise.all([
    params,
    searchParams,
    headers(),
  ])
  const invitationPath = `/accept-invitation/${encodeURIComponent(invitationId)}`
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session?.user.emailVerified) {
    redirect(
      `/sign-in?callbackURL=${encodeURIComponent(invitationPath)}`
    )
  }

  const invitation = await auth.api
    .getInvitation({
      headers: requestHeaders,
      query: { id: invitationId },
    })
    .catch(() => null)

  if (!invitation) {
    return <InvitationUnavailableCard />
  }

  const acceptInvitationAction = acceptWorkspaceInvitation.bind(
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
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Invitation not accepted</AlertTitle>
          <AlertDescription>
            Try again. Link may have expired.
          </AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">
        Invitation matches {session.user.email}.
      </p>
    </WorkspaceInvitationCard>
  )
}
