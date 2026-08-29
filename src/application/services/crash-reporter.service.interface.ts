/** Reports unexpected application failures without coupling callers to Sentry. */
export type CrashReporterService = {
  report(error: unknown): string
}
