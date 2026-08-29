export const LIBRARY_MAX_FILE_SIZE = 20 * 1024 * 1024
export const LIBRARY_MAX_FILES_PER_UPLOAD = 20
export const LIBRARY_MAX_UPLOAD_SIZE = 40 * 1024 * 1024

export type LibraryFileCategory = "images" | "documents" | "code"

const libraryFileTypes = {
  ".c": { category: "code", mediaType: "text/x-c" },
  ".cc": { category: "code", mediaType: "text/x-c++" },
  ".cpp": { category: "code", mediaType: "text/x-c++" },
  ".cs": { category: "code", mediaType: "text/x-csharp" },
  ".css": { category: "code", mediaType: "text/css" },
  ".csv": { category: "documents", mediaType: "text/csv" },
  ".gif": { category: "images", mediaType: "image/gif" },
  ".go": { category: "code", mediaType: "text/x-go" },
  ".h": { category: "code", mediaType: "text/x-c" },
  ".hpp": { category: "code", mediaType: "text/x-c++" },
  ".html": { category: "code", mediaType: "text/html" },
  ".java": { category: "code", mediaType: "text/x-java-source" },
  ".jpeg": { category: "images", mediaType: "image/jpeg" },
  ".jpg": { category: "images", mediaType: "image/jpeg" },
  ".js": { category: "code", mediaType: "text/javascript" },
  ".json": { category: "code", mediaType: "application/json" },
  ".jsonc": { category: "code", mediaType: "application/json" },
  ".jsx": { category: "code", mediaType: "text/jsx" },
  ".log": { category: "code", mediaType: "text/plain" },
  ".md": { category: "code", mediaType: "text/markdown" },
  ".mdx": { category: "code", mediaType: "text/markdown" },
  ".pdf": { category: "documents", mediaType: "application/pdf" },
  ".php": { category: "code", mediaType: "text/x-php" },
  ".png": { category: "images", mediaType: "image/png" },
  ".py": { category: "code", mediaType: "text/x-python" },
  ".rb": { category: "code", mediaType: "text/x-ruby" },
  ".rs": { category: "code", mediaType: "text/x-rust" },
  ".sh": { category: "code", mediaType: "text/x-shellscript" },
  ".sql": { category: "code", mediaType: "application/sql" },
  ".toml": { category: "code", mediaType: "application/toml" },
  ".ts": { category: "code", mediaType: "text/typescript" },
  ".tsx": { category: "code", mediaType: "text/typescript" },
  ".txt": { category: "code", mediaType: "text/plain" },
  ".webp": { category: "images", mediaType: "image/webp" },
  ".xml": { category: "code", mediaType: "application/xml" },
  ".yaml": { category: "code", mediaType: "application/yaml" },
  ".yml": { category: "code", mediaType: "application/yaml" },
} as const satisfies Record<
  string,
  { category: LibraryFileCategory; mediaType: string }
>

const libraryMediaTypeAliases: Readonly<Record<string, readonly string[]>> = {
  "application/json": ["text/json"],
  "application/xml": ["text/xml"],
  "application/yaml": ["text/yaml", "text/x-yaml"],
  "text/csv": ["application/csv", "application/vnd.ms-excel"],
  "text/javascript": ["application/javascript"],
  "text/markdown": ["text/x-markdown"],
  "text/typescript": ["application/typescript", "video/mp2t"],
}

/** Browser file-picker whitelist; server repeats validation before persistence. */
export const LIBRARY_FILE_ACCEPT = Object.keys(libraryFileTypes).join(",")

/** Returns canonical safe File type from filename and browser-reported media type. */
export function getAcceptedLibraryFileType(
  filename: string,
  reportedMediaType: string
): { category: LibraryFileCategory; mediaType: string } | null {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
  const fileType = extension
    ? libraryFileTypes[extension as keyof typeof libraryFileTypes]
    : undefined

  if (!fileType) {
    return null
  }

  const normalizedMediaType = reportedMediaType.toLowerCase().split(";", 1)[0]
  const acceptedMediaTypes = [
    fileType.mediaType,
    ...(libraryMediaTypeAliases[fileType.mediaType] ?? []),
  ]

  if (
    normalizedMediaType &&
    normalizedMediaType !== "application/octet-stream" &&
    !acceptedMediaTypes.includes(normalizedMediaType)
  ) {
    return null
  }

  return fileType
}

const libraryBinarySignatures: Readonly<Record<string, readonly number[]>> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
}

/** Confirms bytes match whitelisted text or binary File type. */
export function isAcceptedLibraryFileContent(
  mediaType: string,
  bytes: Uint8Array
) {
  if (isLibraryTextMediaType(mediaType)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
      return true
    } catch {
      return false
    }
  }

  if (mediaType === "image/webp") {
    return (
      [0x52, 0x49, 0x46, 0x46].every(
        (byte, index) => bytes[index] === byte
      ) &&
      [0x57, 0x45, 0x42, 0x50].every(
        (byte, index) => bytes[index + 8] === byte
      )
    )
  }

  const signature = libraryBinarySignatures[mediaType]
  return Boolean(
    signature?.every((byte, index) => bytes[index] === byte)
  )
}

/** Reports whether File bytes can be passed to model as UTF-8 text. */
export function isLibraryTextMediaType(mediaType: string) {
  return (
    mediaType.startsWith("text/") ||
    [
      "application/json",
      "application/sql",
      "application/toml",
      "application/xml",
      "application/yaml",
    ].includes(mediaType)
  )
}

/** Maps persisted canonical media type to Library filter category. */
export function getLibraryFileCategory(
  mediaType: string
): LibraryFileCategory {
  return (
    Object.values(libraryFileTypes).find(
      (fileType) => fileType.mediaType === mediaType
    )?.category ?? "code"
  )
}

/** Returns preferred extension for assistant-generated File names. */
export function getLibraryFileExtension(mediaType: string) {
  return (
    Object.entries(libraryFileTypes).find(
      ([, fileType]) => fileType.mediaType === mediaType
    )?.[0] ?? ".bin"
  )
}

const libraryFileDownloadPath = "/api/library/files/"

/** Builds owner-checked download URL stored in AI SDK File parts. */
export function createLibraryFileDownloadUrl(fileId: string) {
  return `${libraryFileDownloadPath}${fileId}`
}

/** Extracts Library File id from app-owned download URL, excluding external URLs. */
export function getLibraryFileIdFromDownloadUrl(url: string) {
  const match = /^\/api\/library\/files\/([0-9a-f-]{36})$/i.exec(url)
  return match?.[1] ?? null
}

/** Collects unique Library File ids referenced by message file parts. */
export function getMessageLibraryFileIds(parts: readonly unknown[]) {
  return [
    ...new Set(
      parts.flatMap((part) => {
        if (
          typeof part !== "object" ||
          part === null ||
          !("type" in part) ||
          part.type !== "file" ||
          !("url" in part) ||
          typeof part.url !== "string"
        ) {
          return []
        }

        const fileId = getLibraryFileIdFromDownloadUrl(part.url)
        return fileId ? [fileId] : []
      })
    ),
  ]
}

/** User and workspace pair that scopes every Library operation. */
export type LibraryOwnerScope = {
  readonly organizationId: string
  readonly ownerId: string
}

/** Flat grouping of Files in one owner's workspace Library. */
export type LibraryFolder = LibraryOwnerScope & {
  readonly createdAt: Date
  readonly id: string
  readonly name: string
}

/** File metadata used by Library listings; bytes are intentionally absent. */
export type LibraryFileSummary = LibraryOwnerScope & {
  readonly createdAt: Date
  readonly folderId: string | null
  readonly id: string
  readonly mediaType: string
  readonly name: string
  readonly provenanceChatId: string | null
  readonly provenanceChatTitle: string | null
  readonly provenanceMessageId: string | null
  readonly size: number
}

/** Full Library File fetched only for owner-checked download or model ingestion. */
export type LibraryFile = LibraryFileSummary & {
  readonly bytes: Uint8Array
}
