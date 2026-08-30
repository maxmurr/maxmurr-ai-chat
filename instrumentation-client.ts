import {
  captureSentryRouterTransitionStart,
  initializeSentryClientWhenIdle,
} from "@/lib/sentry-client";

initializeSentryClientWhenIdle();

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  captureSentryRouterTransitionStart(url, navigationType);
}
