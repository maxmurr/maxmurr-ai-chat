"use server"

import { refresh } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { auth } from "@/di/authentication"
import { inviteWorkspaceMembers } from "@/features/workspace/workspace-invitations"
import { reportUnexpectedBetterAuthError } from "@/lib/better-auth-error-reporting"
import { traceServerAction } from "@/lib/server-action-tracing"

const workspaceIdSchema = z.string().trim().min(1).max(128)
const workspaceMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["admin", "member"]),
})
const workspaceCreationSchema = z.object({
  members: z.array(workspaceMemberSchema).max(5),
  name: z.string().trim().min(1).max(48),
})
const workspaceInvitationEmailsSchema = z.array(
  z.string().trim().email().max(254)
).max(20)

async function createWorkspace(name: string, requestHeaders: Headers) {
  return auth.api.createOrganization({
    body: { name, slug: crypto.randomUUID() },
    headers: requestHeaders,
  })
}

/** Creates first workspace without refreshing onboarding before invite step. */
export async function createFirstWorkspaceAction(name: unknown) {
  return traceServerAction("createFirstWorkspaceAction", async () => {
    const parsed = workspaceCreationSchema.shape.name.safeParse(name)

    if (!parsed.success) {
      return {
        error: "Check workspace details and try again.",
        ok: false as const,
      }
    }

    try {
      const workspace = await createWorkspace(parsed.data, await headers())
      // Onboarding performs full navigation after optional invitations.
      return {
        ok: true as const,
        workspace: { id: workspace.id, name: workspace.name },
      }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return {
        error: "Could not create workspace. Try again.",
        ok: false as const,
      }
    }
  })
}

/** Creates workspace, sends initial invitations, and refreshes app data. */
export async function createWorkspaceAction(input: unknown) {
  return traceServerAction("createWorkspaceAction", async () => {
    const parsed = workspaceCreationSchema.safeParse(input)

    if (!parsed.success) {
      return {
        error: "Check workspace details and try again.",
        ok: false as const,
      }
    }

    const requestHeaders = await headers()

    try {
      const workspace = await createWorkspace(
        parsed.data.name,
        requestHeaders
      )
      const failedInvitationEmails = await inviteWorkspaceMembers(
        workspace.id,
        parsed.data.members,
        (invitation) =>
          auth.api.createInvitation({
            body: invitation,
            headers: requestHeaders,
          }),
        reportUnexpectedBetterAuthError
      )

      refresh()
      return {
        failedInvitationEmails,
        ok: true as const,
        workspace: { id: workspace.id, name: workspace.name },
      }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return {
        error: "Could not create workspace. Try again.",
        ok: false as const,
      }
    }
  })
}

/** Invites first-workspace members before onboarding navigation. */
export async function inviteFirstWorkspaceMembersAction(
  workspaceId: unknown,
  emails: unknown
) {
  return traceServerAction(
    "inviteFirstWorkspaceMembersAction",
    async () => {
      const parsedWorkspaceId = workspaceIdSchema.safeParse(workspaceId)
      const parsedEmails = workspaceInvitationEmailsSchema.safeParse(emails)

      if (!parsedWorkspaceId.success || !parsedEmails.success) {
        return {
          error: "Check invitation details and try again.",
          ok: false as const,
        }
      }

      const requestHeaders = await headers()
      const failedInvitationEmails = await inviteWorkspaceMembers(
        parsedWorkspaceId.data,
        parsedEmails.data.map((email) => ({
          email,
          role: "member" as const,
        })),
        (invitation) =>
          auth.api.createInvitation({
            body: invitation,
            headers: requestHeaders,
          }),
        reportUnexpectedBetterAuthError
      )

      return { failedInvitationEmails, ok: true as const }
    }
  )
}

/** Changes active workspace and refreshes workspace-scoped server data. */
export async function switchWorkspaceAction(workspaceId: unknown) {
  return traceServerAction("switchWorkspaceAction", async () => {
    const parsed = workspaceIdSchema.safeParse(workspaceId)

    if (!parsed.success) {
      return { error: "Could not switch workspace.", ok: false as const }
    }

    try {
      await auth.api.setActiveOrganization({
        body: { organizationId: parsed.data },
        headers: await headers(),
      })
      refresh()
      return { ok: true as const }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return { error: "Could not switch workspace.", ok: false as const }
    }
  })
}

/** Accepts validated workspace invitation and redirects into chat. */
export async function acceptWorkspaceInvitationAction(invitationId: unknown) {
  return traceServerAction("acceptWorkspaceInvitationAction", async () => {
    const parsed = workspaceIdSchema.safeParse(invitationId)

    if (!parsed.success) {
      redirect("/accept-invitation/invalid?error=accept")
    }

    try {
      await auth.api.acceptInvitation({
        body: { invitationId: parsed.data },
        headers: await headers(),
      })
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      redirect(
        `/accept-invitation/${encodeURIComponent(parsed.data)}?error=accept`
      )
    }

    redirect("/chat")
  })
}
