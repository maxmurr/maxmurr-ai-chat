import "server-only"

import { notFound } from "next/navigation"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { getAuthenticatedWorkspaceContext, getWorkspaceOwnerScope } from "@/features/workspace/workspace-queries"
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
} from "@/src/entities/errors/library-errors"

function libraryController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  )
}

/** Lists owner-scoped Library root or Folder for server components. */
export async function getLibraryPageListing(folderId: string | null) {
  const { activeWorkspaceId, userId } =
    await getAuthenticatedWorkspaceContext()

  try {
    const listing = await libraryController().listLibrary(folderId, {
      organizationId: activeWorkspaceId,
      ownerId: userId,
    })

    if (folderId && !listing.folder) {
      notFound()
    }

    return listing
  } catch (error) {
    if (
      error instanceof InvalidLibraryRequestError ||
      error instanceof LibraryAccessDeniedError
    ) {
      notFound()
    }

    throw error
  }
}

/** Resolves session-derived Library owner scope from request headers. */
export async function getLibraryRequestContext(requestHeaders: Headers) {
  return getWorkspaceOwnerScope(requestHeaders)
}

/** Returns Library route-handler scope or matching HTTP error response. */
export async function requireLibraryRouteScope(
  requestHeaders: Headers
): Promise<
  | { scope: { organizationId: string; ownerId: string }; response?: never }
  | { response: Response; scope?: never }
> {
  let context: Awaited<ReturnType<typeof getLibraryRequestContext>>

  try {
    context = await getLibraryRequestContext(requestHeaders)
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
