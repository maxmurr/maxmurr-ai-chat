import { requireLibraryRouteScope } from "@/app/library/library-request-context"
import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
  LibraryFileRejectedError,
} from "@/src/entities/errors/library-errors"
import { LIBRARY_MAX_UPLOAD_SIZE } from "@/src/entities/models/library"

export const runtime = "nodejs"

// Transport-level cap only; the controller enforces the per-file, count, and
// total limits. Headroom covers multipart boundaries and field overhead.
const MAX_MULTIPART_BODY_SIZE = LIBRARY_MAX_UPLOAD_SIZE + 1024 * 1024

async function parseLimitedLibraryFormData(request: Request) {
  const contentType = request.headers.get("content-type")

  if (!contentType || !request.body) {
    throw new InvalidLibraryRequestError()
  }

  let receivedBytes = 0
  const limitedBody = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        receivedBytes += chunk.byteLength

        if (receivedBytes > MAX_MULTIPART_BODY_SIZE) {
          controller.error(new LibraryFileRejectedError("total-size"))
          return
        }

        controller.enqueue(chunk)
      },
    })
  )

  return new Response(limitedBody, {
    headers: { "Content-Type": contentType },
  }).formData()
}

function libraryUploadError(error: unknown) {
  if (error instanceof LibraryFileRejectedError) {
    return Response.json(
      { error: error.message },
      { status: error.reason === "type" ? 415 : 413 }
    )
  }

  if (error instanceof InvalidLibraryRequestError) {
    return Response.json({ error: "Invalid Library upload." }, { status: 400 })
  }

  if (error instanceof LibraryAccessDeniedError) {
    return Response.json({ error: "Folder not found." }, { status: 404 })
  }

  console.error(
    "Library upload failed.",
    error instanceof Error ? error.message : "Unknown error"
  )
  return Response.json({ error: "Could not upload Files." }, { status: 500 })
}

/** Stores multipart Files in authenticated owner's active Workspace Library. */
export async function POST(request: Request) {
  const guard = await requireLibraryRouteScope(request.headers)

  if (guard.response) {
    return guard.response
  }

  try {
    const contentLength = Number(request.headers.get("content-length"))
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_MULTIPART_BODY_SIZE
    ) {
      throw new LibraryFileRejectedError("total-size")
    }

    const formData = await parseLimitedLibraryFormData(request)
    const folderValue = formData.get("folderId")
    const folderId =
      typeof folderValue === "string" && folderValue ? folderValue : null
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File)

    const inputs = []
    for (const file of files) {
      inputs.push({
        bytes: new Uint8Array(await file.arrayBuffer()),
        folderId,
        mediaType: file.type,
        name: file.name,
      })
    }
    const controller = resolveApplicationDependency(
      applicationInjectionTokens.libraryController
    )
    const uploadedFiles = await controller.uploadFiles(inputs, guard.scope)

    return Response.json({
      files: uploadedFiles.map(({ id, mediaType, name, size }) => ({
        id,
        mediaType,
        name,
        size,
      })),
    })
  } catch (error) {
    return libraryUploadError(error)
  }
}
