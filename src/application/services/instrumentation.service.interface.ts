/** Primitive attributes safe to attach to an application trace span. */
export type ApplicationSpanAttributes = Record<
  string,
  string | number | boolean
>

/** Provider-neutral options for one application trace span. */
export type ApplicationSpanOptions = {
  attributes?: ApplicationSpanAttributes
  name: string
  op?: string
}

/** Trace context accepted when instrumenting one Next.js Server Action. */
export type ServerActionTraceOptions = {
  headers?: Headers
  recordResponse?: boolean
}

/** Creates trace spans without coupling application code to Sentry. */
export type InstrumentationService = {
  instrumentServerAction<T>(
    name: string,
    options: ServerActionTraceOptions,
    callback: () => Promise<T>
  ): Promise<T>
  startSpan<T>(options: ApplicationSpanOptions, callback: () => T): T
}
