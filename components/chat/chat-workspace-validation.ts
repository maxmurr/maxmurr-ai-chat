/** Maximum initial members accepted by chat workspace creation. */
export const MAX_CHAT_WORKSPACE_MEMBERS = 5

const CHAT_WORKSPACE_MEMBER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Workspace role assigned by initial member form. */
export type ChatWorkspaceMemberRole = "admin" | "member"

/** Editable member row used by chat workspace creation form. */
export type ChatWorkspaceFormMember = {
  id: string
  email: string
  role: ChatWorkspaceMemberRole
}

/** Returns first text validation error reported by chat workspace form. */
export function getChatWorkspaceFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

/** Validates workspace names before availability checks run. */
export function validateChatWorkspaceName(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return "Enter a workspace name."
  }

  if (normalizedName.length < 2) {
    return "Workspace name must have at least 2 characters."
  }

  if (normalizedName.length > 48) {
    return "Workspace name must have at most 48 characters."
  }

  return undefined
}

/** Validates one member email in workspace access settings. */
export function validateChatWorkspaceMemberEmail(email: string) {
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    return "Enter a member email."
  }

  if (
    normalizedEmail.length > 254 ||
    !CHAT_WORKSPACE_MEMBER_EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "Enter a valid email address."
  }

  return undefined
}

/** Validates member count and duplicate emails across workspace member array. */
export function validateChatWorkspaceMembers(
  members: ChatWorkspaceFormMember[],
) {
  if (members.length > MAX_CHAT_WORKSPACE_MEMBERS) {
    return `Add no more than ${MAX_CHAT_WORKSPACE_MEMBERS} members.`
  }

  const emails = members.map(({ email }) => email.trim().toLowerCase())
  const uniqueEmails = new Set(emails.filter(Boolean))

  if (uniqueEmails.size !== emails.filter(Boolean).length) {
    return "Each member email must be unique."
  }

  return undefined
}
