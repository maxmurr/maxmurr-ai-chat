const DEFAULT_AUTHENTICATION_CALLBACK_PATH = "/chat"
const AUTHENTICATION_CALLBACK_BASE_URL = "https://callback.invalid"

/** Allows same-origin relative auth callbacks and rejects open redirects. */
export function getSafeAuthenticationCallbackPath(callbackValue: unknown) {
  if (typeof callbackValue !== "string" || !callbackValue.startsWith("/")) {
    return DEFAULT_AUTHENTICATION_CALLBACK_PATH
  }

  try {
    const callbackUrl = new URL(
      callbackValue,
      AUTHENTICATION_CALLBACK_BASE_URL
    )

    if (callbackUrl.origin !== AUTHENTICATION_CALLBACK_BASE_URL) {
      return DEFAULT_AUTHENTICATION_CALLBACK_PATH
    }

    return `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`
  } catch {
    return DEFAULT_AUTHENTICATION_CALLBACK_PATH
  }
}
