export type WorkspaceInvitationMember = {
  email: string
  role: "admin" | "member"
}

type SendWorkspaceInvitation = (invitation: {
  email: string
  organizationId: string
  role: "admin" | "member"
}) => Promise<unknown>

/** Invites workspace members independently and returns normalized failed emails. */
export async function inviteWorkspaceMembers(
  organizationId: string,
  members: readonly WorkspaceInvitationMember[],
  sendInvitation: SendWorkspaceInvitation
) {
  const results = await Promise.all(
    members.map(async ({ email, role }) => {
      const normalizedEmail = email.trim().toLowerCase()

      try {
        await sendInvitation({
          email: normalizedEmail,
          organizationId,
          role,
        })
        return null
      } catch {
        return normalizedEmail
      }
    })
  )

  return results.filter((email): email is string => email !== null)
}
