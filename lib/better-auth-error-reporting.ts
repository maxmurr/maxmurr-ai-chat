import "server-only"

import { APIError } from "better-auth/api"

import { reportUnexpectedServerError } from "@/lib/server-error-reporting"

/** Reports Better Auth transport or server failures while ignoring expected 4xx errors. */
export function reportUnexpectedBetterAuthError(error: unknown): void {
  if (!(error instanceof APIError) || error.statusCode >= 500) {
    reportUnexpectedServerError(error)
  }
}
