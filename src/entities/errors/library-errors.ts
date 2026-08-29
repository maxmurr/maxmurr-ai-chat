/** Reports malformed Library input at controller seam. */
export class InvalidLibraryRequestError extends Error {
  constructor(options?: ErrorOptions) {
    super("Invalid Library request.", options)
    this.name = "InvalidLibraryRequestError"
  }
}

/** Signals requester may not read or mutate this Folder or File. */
export class LibraryAccessDeniedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Library access denied.", options)
    this.name = "LibraryAccessDeniedError"
  }
}

export type LibraryFileRejectionReason =
  | "count"
  | "size"
  | "total-size"
  | "type"

/** Reports why one or more Files cannot enter Library. */
export class LibraryFileRejectedError extends Error {
  readonly reason: LibraryFileRejectionReason

  constructor(reason: LibraryFileRejectionReason, filename?: string) {
    const message =
      reason === "count"
        ? "Upload contains more than 20 Files."
        : reason === "total-size"
          ? "Upload exceeds 40 MB total."
          : reason === "size"
            ? `File exceeds 20 MB: ${filename ?? "unnamed File"}`
            : `File type or content is not allowed: ${filename ?? "unnamed File"}`

    super(message)
    this.name = "LibraryFileRejectedError"
    this.reason = reason
  }
}
