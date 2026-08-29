/** Maximum initial members accepted by Workspace creation. */
export const MAX_WORKSPACE_CREATION_MEMBERS = 5;

const WORKSPACE_CREATION_MEMBER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Workspace role assigned by the initial member form. */
export type WorkspaceCreationMemberRole = "admin" | "member";

/** Editable member row used by the Workspace creation form. */
export type WorkspaceCreationFormMember = {
  id: string;
  email: string;
  role: WorkspaceCreationMemberRole;
};

/** Returns the first text validation error reported by Workspace creation. */
export function getWorkspaceCreationFieldError(errors: unknown[]) {
  return errors.find((error): error is string => typeof error === "string");
}

/** Validates a Workspace name before availability checks run. */
export function validateWorkspaceCreationName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return "Enter a workspace name.";
  }

  if (normalizedName.length < 2) {
    return "Workspace name must have at least 2 characters.";
  }

  if (normalizedName.length > 48) {
    return "Workspace name must have at most 48 characters.";
  }

  return undefined;
}

/** Validates one member email in Workspace creation. */
export function validateWorkspaceCreationMemberEmail(email: string) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return "Enter a member email.";
  }

  if (
    normalizedEmail.length > 254 ||
    !WORKSPACE_CREATION_MEMBER_EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "Enter a valid email address.";
  }

  return undefined;
}

/** Validates member count and duplicate emails during Workspace creation. */
export function validateWorkspaceCreationMembers(
  members: WorkspaceCreationFormMember[]
) {
  if (members.length > MAX_WORKSPACE_CREATION_MEMBERS) {
    return `Add no more than ${MAX_WORKSPACE_CREATION_MEMBERS} members.`;
  }

  const emails = members.map(({ email }) => email.trim().toLowerCase());
  const uniqueEmails = new Set(emails.filter(Boolean));

  if (uniqueEmails.size !== emails.filter(Boolean).length) {
    return "Each member email must be unique.";
  }

  return undefined;
}
