import * as Sentry from "@sentry/nextjs"

/** Initializes Sentry before Node.js or Edge requests run. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/** Captures uncaught Server Component, Route Handler, and Proxy errors. */
export const onRequestError = Sentry.captureRequestError
