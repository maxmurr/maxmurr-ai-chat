import "server-only"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

/** Reports one caught, unexpected server failure through configured adapter. */
export function reportUnexpectedServerError(error: unknown): string {
  return resolveApplicationDependency(
    applicationInjectionTokens.crashReporter
  ).report(error)
}
