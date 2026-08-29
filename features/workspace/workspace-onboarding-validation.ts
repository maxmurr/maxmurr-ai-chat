/** Maximum first-workspace name length accepted during onboarding. */
export const ONBOARDING_WORKSPACE_NAME_MAX_LENGTH = 50

const ONBOARDING_INVITE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Returns first text validation error reported by onboarding forms. */
export function getOnboardingFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string")
}

/** Validates first-workspace name before workspace creation. */
export function validateOnboardingWorkspaceName(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return "Enter a workspace name."
  }

  if (normalizedName.length > ONBOARDING_WORKSPACE_NAME_MAX_LENGTH) {
    return `Workspace name must have at most ${ONBOARDING_WORKSPACE_NAME_MAX_LENGTH} characters.`
  }

  return undefined
}

/** Parses comma-separated teammate emails for workspace invitations. */
export function parseOnboardingInviteEmails(value: string) {
  return [...new Set(value.split(",").map((email) => email.trim().toLowerCase()))]
    .filter(Boolean)
}

/** Validates optional comma-separated teammate invitation emails. */
export function validateOnboardingInviteEmails(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const emails = value.split(",").map((email) => email.trim())

  if (
    emails.some(
      (email) =>
        !email ||
        email.length > 254 ||
        !ONBOARDING_INVITE_EMAIL_PATTERN.test(email),
    )
  ) {
    return "Enter valid email addresses separated by commas."
  }

  return undefined
}
