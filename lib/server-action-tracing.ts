import "server-only"

import { headers } from "next/headers"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

/** Runs one Next.js Server Action inside a named, distributed Sentry trace. */
export async function traceServerAction<T>(
  name: string,
  callback: () => Promise<T>
): Promise<T> {
  const instrumentation = resolveApplicationDependency(
    applicationInjectionTokens.instrumentation
  )

  return instrumentation.instrumentServerAction(
    name,
    { headers: await headers(), recordResponse: false },
    callback
  )
}
