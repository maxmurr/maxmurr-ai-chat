import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ChatPageShell } from "@/components/chat/chat-page-shell"
import { auth } from "@/di/authentication"

/** Requires an onboarded session before rendering empty new-chat page. */
export default async function ChatPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    redirect("/sign-in")
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  })

  if (organizations.length === 0) {
    redirect("/onboarding")
  }

  const name = session.user.username ?? session.user.name

  return (
    <ChatPageShell
      activeWorkspaceId={session.session.activeOrganizationId ?? undefined}
      currentUser={{
        avatar: session.user.image ?? "",
        email: session.user.email,
        initials: name.slice(0, 2).toUpperCase(),
        name,
      }}
      workspaces={organizations.map(({ id, name: workspaceName }) => ({
        id,
        name: workspaceName,
      }))}
    />
  )
}
