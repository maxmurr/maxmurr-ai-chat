/**
 * Resolves the active Workspace from current memberships only — sessions can
 * start without one or retain a stale id after leaving a Workspace. Falls
 * back to the first membership, matching the workspace switcher's display.
 */
export function resolveActiveWorkspaceId(
  workspaces: readonly { id: string }[],
  activeWorkspaceId: string | null | undefined
) {
  return (
    workspaces.find(({ id }) => id === activeWorkspaceId)?.id ??
    workspaces[0]?.id ??
    null
  )
}
