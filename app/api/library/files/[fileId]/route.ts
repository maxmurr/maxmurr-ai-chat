import { requireLibraryRouteScope } from "@/features/library/library-queries"
import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { reportUnexpectedServerError } from "@/lib/server-error-reporting"
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
} from "@/src/entities/errors/library-errors"

function encodeDownloadFilename(filename: string) {
  return encodeURIComponent(filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

/** Serves one owner-checked File from active Workspace Library. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const guard = await requireLibraryRouteScope(request.headers)

  if (guard.response) {
    return guard.response
  }

  try {
    const { fileId } = await params
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.libraryController
    )
    const file = await controller.downloadFile(fileId, guard.scope)
    const body = Uint8Array.from(file.bytes).buffer

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeDownloadFilename(file.name)}`,
        "Content-Length": String(file.size),
        "Content-Type": file.mediaType,
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    if (
      error instanceof InvalidLibraryRequestError ||
      error instanceof LibraryAccessDeniedError
    ) {
      return Response.json({ error: "File not found." }, { status: 404 })
    }

    reportUnexpectedServerError(error)
    console.error(
      "Library download failed.",
      error instanceof Error ? error.message : "Unknown error"
    )
    return Response.json({ error: "Could not download File." }, { status: 500 })
  }
}
