import { createModule } from "@evyweb/ioctopus"

import {
  applicationInjectionTokens,
  type ApplicationDependencyRegistry,
} from "@/di/application-container.registry"
import { sentryCrashReporterService } from "@/src/infrastructure/services/sentry-crash-reporter.service"
import { sentryInstrumentationService } from "@/src/infrastructure/services/sentry-instrumentation.service"

/** Registers Sentry-backed crash reporting and tracing adapters. */
export function createMonitoringModule() {
  const monitoringModule = createModule<ApplicationDependencyRegistry>()

  monitoringModule
    .bind(applicationInjectionTokens.crashReporter)
    .toValue(sentryCrashReporterService)
  monitoringModule
    .bind(applicationInjectionTokens.instrumentation)
    .toValue(sentryInstrumentationService)

  return monitoringModule
}
