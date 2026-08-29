import assert from "node:assert/strict"
import { test } from "node:test"
import { APIError } from "better-auth/api"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"
import { reportUnexpectedBetterAuthError } from "@/lib/better-auth-error-reporting"

test("Better Auth reporting ignores expected 4xx failures", () => {
  const crashReporter = resolveApplicationDependency(
    applicationInjectionTokens.crashReporter
  )
  const originalReport = crashReporter.report
  const reportedErrors: unknown[] = []

  crashReporter.report = (error) => {
    reportedErrors.push(error)
    return "test-event-id"
  }

  try {
    reportUnexpectedBetterAuthError(new APIError("BAD_REQUEST"))
    const serverError = new APIError("INTERNAL_SERVER_ERROR")
    reportUnexpectedBetterAuthError(serverError)

    assert.deepEqual(reportedErrors, [serverError])
  } finally {
    crashReporter.report = originalReport
  }
})
