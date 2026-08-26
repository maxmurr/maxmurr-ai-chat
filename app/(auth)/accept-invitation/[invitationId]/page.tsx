import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>
          <h1>Invitation unavailable</h1>
        </CardTitle>
        <CardDescription>
          Link expired, was already used, or belongs to another email address.
        </CardDescription>
      </CardHeader>
      <CardFooter className="text-sm text-muted-foreground">
        Sign in with invited email, then open link again.
      </CardFooter>
    </Card>
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

  if (!session) {
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
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>
          <h1>Join {invitation.organizationName}</h1>
        </CardTitle>
        <CardDescription>
          {invitation.inviterEmail} invited you to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
      </CardContent>
      <CardFooter>
        <form action={acceptInvitationAction} className="w-full">
          <Button className="h-11 w-full touch-manipulation" type="submit">
            Accept invitation
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
