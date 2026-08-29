/** Reports malformed Project input at controller seam. */
export class InvalidProjectRequestError extends Error {
  constructor(options?: ErrorOptions) {
    super("Invalid Project request.", options);
    this.name = "InvalidProjectRequestError";
  }
}

/** Signals requester may not read or mutate this Project. */
export class ProjectAccessDeniedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Project access denied.", options);
    this.name = "ProjectAccessDeniedError";
  }
}
