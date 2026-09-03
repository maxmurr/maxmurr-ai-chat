export const accountRoles = {
  superAdmin: "superadmin",
  workspace: "workspace",
} as const;

/** Platform-level role assigned to one User, independent of Workspace membership. */
export type AccountRole = (typeof accountRoles)[keyof typeof accountRoles];

/** Account role assigned to new and existing users by default. */
export const DEFAULT_ACCOUNT_ROLE = accountRoles.workspace;

/** Reports whether Account Role grants Backoffice access. */
export function accountRoleCanAccessBackoffice(
  role: string | null | undefined
) {
  return role === accountRoles.superAdmin;
}
