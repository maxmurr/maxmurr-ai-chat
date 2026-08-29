import * as Sentry from "@sentry/nextjs"

import type { CrashReporterService } from "@/src/application/services/crash-reporter.service.interface"

/** Sends unexpected application failures to configured Sentry project. */
export const sentryCrashReporterService: CrashReporterService = {
  report(error) {
    return Sentry.captureException(error)
  },
}
