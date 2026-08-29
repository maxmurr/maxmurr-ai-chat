import * as Sentry from "@sentry/nextjs"

const sentryDsn = process.env.SENTRY_DSN

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn) && process.env.NODE_ENV !== "test",
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
})
