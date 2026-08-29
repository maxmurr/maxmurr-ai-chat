import * as Sentry from "@sentry/nextjs"

import type { InstrumentationService } from "@/src/application/services/instrumentation.service.interface"

/** Implements application and Server Action tracing with Sentry spans. */
export const sentryInstrumentationService: InstrumentationService = {
  async instrumentServerAction(name, options, callback) {
    return await Sentry.withServerActionInstrumentation(
      name,
      options,
      callback
    )
  },

  startSpan(options, callback) {
    return Sentry.startSpan(options, callback)
  },
}
