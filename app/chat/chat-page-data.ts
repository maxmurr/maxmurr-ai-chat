import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { auth } from "@/di/authentication"

/** Loads the session, workspace, and sidebar chats every chat page needs. */
export async function loadChatPageData() {
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

  // Sessions start without an active workspace; fall back to the first
  // membership, matching the workspace switcher's display fallback.
  const activeWorkspaceId =
    session.session.activeOrganizationId ?? organizations[0].id
  const chatLibrary = resolveApplicationDependency(
    applicationInjectionTokens.chatLibraryController
  )
  const { ownChats, teamChats } = await chatLibrary.listSidebarChats(
    activeWorkspaceId,
    session.user.id
  )
  const name = session.user.username ?? session.user.name

  return {
    activeWorkspaceId,
    chatLibrary,
    currentUser: {
      avatar: session.user.image ?? "",
      email: session.user.email,
      initials: name.slice(0, 2).toUpperCase(),
      name,
    },
    ownChats: ownChats.map(
      ({ id, pinned, publicToken, title, updatedAt, visibility }) => ({
        id,
        pinned,
        publicToken,
        title,
        updatedAt,
        visibility,
      })
    ),
    teamChats: teamChats.map(({ id, title }) => ({ id, title })),
    userId: session.user.id,
    workspaces: organizations.map(({ id, name: workspaceName }) => ({
      id,
      name: workspaceName,
    })),
  }
}
