import { auth } from "@/di/authentication"
import { resolveActiveWorkspaceId } from "@/lib/active-workspace"

/** Resolves session-derived owner and active Workspace for Library entry points. */
export async function resolveLibraryRequestContext(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    return { status: "unauthorized" as const }
  }

  const workspaces = await auth.api.listOrganizations({
    headers: requestHeaders,
  })
  const workspaceId = resolveActiveWorkspaceId(
    workspaces,
    session.session.activeOrganizationId
  )

  if (!workspaceId) {
    return { status: "workspace-required" as const }
  }

  return {
    scope: {
      organizationId: workspaceId,
      ownerId: session.user.id,
    },
    status: "authorized" as const,
  }
}

/**
 * Route-handler guard over resolveLibraryRequestContext: returns the owner
 * scope or the HTTP error response the handler should send verbatim.
 */
export async function requireLibraryRouteScope(
  requestHeaders: Headers
): Promise<
  | { scope: { organizationId: string; ownerId: string }; response?: never }
  | { response: Response; scope?: never }
> {
  let context: Awaited<ReturnType<typeof resolveLibraryRequestContext>>

  try {
    context = await resolveLibraryRequestContext(requestHeaders)
  } catch (error) {
    console.error(
      "Library authorization failed.",
      error instanceof Error ? error.message : "Unknown error"
    )
    return {
      response: Response.json(
        { error: "Authorization is unavailable." },
        { status: 503 }
      ),
    }
  }

  if (context.status === "unauthorized") {
    return {
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    }
  }

  if (context.status === "workspace-required") {
    return {
      response: Response.json(
        { error: "Workspace is required." },
        { status: 403 }
      ),
    }
  }

  return { scope: context.scope }
}
