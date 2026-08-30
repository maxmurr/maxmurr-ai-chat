"use client";

type SentryClientModule = Pick<
  typeof import("@sentry/nextjs"),
  "captureException" | "captureRouterTransitionStart"
>;

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let sentryClientPromise: Promise<SentryClientModule> | undefined;

function loadSentryClient() {
  sentryClientPromise ??= import("@sentry/nextjs")
    .then(({ captureException, captureRouterTransitionStart, init }) => {
      init({
        dsn: sentryDsn,
        enabled: Boolean(sentryDsn) && process.env.NODE_ENV !== "test",
        sendDefaultPii: false,
        tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
      });
      return { captureException, captureRouterTransitionStart };
    })
    .catch((error) => {
      sentryClientPromise = undefined;
      throw error;
    });

  return sentryClientPromise;
}

function reportSentryClientLoadError(error: unknown) {
  console.error("Sentry client failed to load.", error);
}

/** Loads browser error monitoring after hydration no longer needs the main thread. */
export function initializeSentryClientWhenIdle() {
  const initialize = () => {
    void loadSentryClient().catch(reportSentryClientLoadError);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(initialize, { timeout: 2_000 });
    return;
  }

  globalThis.setTimeout(initialize, 0);
}

/** Reports one browser or React error after loading the Sentry client. */
export function captureSentryClientException(error: unknown) {
  void loadSentryClient()
    .then((Sentry) => Sentry.captureException(error))
    .catch(reportSentryClientLoadError);
}

/** Starts one App Router navigation span after loading the Sentry client. */
export function captureSentryRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  void loadSentryClient()
    .then((Sentry) => Sentry.captureRouterTransitionStart(url, navigationType))
    .catch(reportSentryClientLoadError);
}
